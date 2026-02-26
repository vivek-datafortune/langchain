import { User } from '../../../models/User.js';
import { Test } from '../../../models/Test.js';
import { Clinic } from '../../../models/Clinic.js';
import { City } from '../../../models/City.js';
import { State } from '../../../models/State.js';
import { Country } from '../../../models/Country.js';

const DEFAULT_LIMIT = 50;

// ---------------------------------------------------------------------------
// Node: fetchDataNode
// Runs a structured, index-backed MongoDB query based on state.intent + params.
// Access control: staff sees clinic patients/tests; patient sees own data + clinic.
// ---------------------------------------------------------------------------
export async function fetchDataNode(state) {
  const { intent, params, clinicId, userId, userType } = state;
  console.log('[fetchData] intent:', intent, '| params:', JSON.stringify(params), '| userType:', userType, '| clinicId:', clinicId, '| userId:', userId);

  try {
    const handler = HANDLERS[intent];
    if (!handler) {
      console.error('[fetchData] No handler for intent:', intent);
      return { dbResult: null, error: `No handler for intent: ${intent}` };
    }
    const dbResult = await handler({ params, clinicId, userId, userType });
    console.log('[fetchData] dbResult:', JSON.stringify(dbResult));
    return { dbResult, error: null };
  } catch (err) {
    console.error('[fetchData] DB error:', err.message, err.stack);
    return { dbResult: null, error: err.message };
  }
}

// ---------------------------------------------------------------------------
// Intent handlers — one per intent
// ---------------------------------------------------------------------------

const HANDLERS = {
  get_clinic:                 handleGetClinic,
  get_my_tests:               handleGetMyTests,
  find_patient_by_phone:      handleFindPatientByPhone,
  find_patient_by_email:      handleFindPatientByEmail,
  find_patient_by_name:       handleFindPatientByName,
  list_patients:              handleListPatients,
  list_tests:                 handleListTests,
  count_patients:             handleCountPatients,
  count_tests:                handleCountTests,
  clinic_summary:             handleClinicSummary,
  patient_detail_with_tests:  handlePatientDetailWithTests,
  unsupported:                handleUnsupported,
};

// ── Clinic info ─────────────────────────────────────────────────────────────

async function handleGetClinic({ clinicId }) {
  const clinic = await Clinic.findById(clinicId).lean();
  if (!clinic) return { clinic: null };

  const [city, st, country] = await Promise.all([
    clinic.city_id    ? City.findById(clinic.city_id).lean()    : null,
    clinic.state_id   ? State.findById(clinic.state_id).lean()  : null,
    clinic.country_id ? Country.findById(clinic.country_id).lean() : null,
  ]);

  return {
    clinic: {
      name: clinic.name,
      email: clinic.email,
      phone_number: clinic.phone_number,
      is_active: clinic.is_active,
    },
    location: {
      city:    city?.name    || null,
      state:   st?.name      || null,
      country: country?.name || null,
    },
  };
}

// ── Patient's own tests ─────────────────────────────────────────────────────

async function handleGetMyTests({ params, clinicId, userId }) {
  const filter = buildTestFilter({ clinicId, userId, params });
  const sort = buildSort(params);
  const limit = params.limit || DEFAULT_LIMIT;

  const tests = await Test.find(filter).sort(sort).limit(limit).lean();
  return { tests: formatTests(tests), count: tests.length };
}

// ── Staff: find patient by identifier ───────────────────────────────────────

async function handleFindPatientByPhone({ params, clinicId }) {
  const patient = await User.findOne({
    clinic_id: clinicId,
    user_type: 'patient',
    phone: params.phone,
  }).lean();
  return { patient: formatUser(patient) };
}

async function handleFindPatientByEmail({ params, clinicId }) {
  const patient = await User.findOne({
    clinic_id: clinicId,
    user_type: 'patient',
    email: params.email,
  }).lean();
  return { patient: formatUser(patient) };
}

async function handleFindPatientByName({ params, clinicId }) {
  const regex = new RegExp(params.name, 'i');
  const patients = await User.find({
    clinic_id: clinicId,
    user_type: 'patient',
    name: regex,
  }).limit(10).lean();
  return { patients: patients.map(formatUser) };
}

// ── Staff: list / count patients ────────────────────────────────────────────

async function handleListPatients({ params, clinicId }) {
  const limit = params.limit || DEFAULT_LIMIT;
  const patients = await User.find({
    clinic_id: clinicId,
    user_type: 'patient',
  }).limit(limit).lean();
  return { patients: patients.map(formatUser), count: patients.length };
}

async function handleCountPatients({ clinicId }) {
  const count = await User.countDocuments({
    clinic_id: clinicId,
    user_type: 'patient',
  });
  return { count };
}

// ── Staff: list / count tests ───────────────────────────────────────────────

async function handleListTests({ params, clinicId }) {
  const filter = buildTestFilter({ clinicId, params });
  const sort = buildSort(params);
  const limit = params.limit || DEFAULT_LIMIT;

  const tests = await Test.find(filter).sort(sort).limit(limit).lean();
  return { tests: formatTests(tests), count: tests.length };
}

async function handleCountTests({ params, clinicId, userId, userType }) {
  const filter = userType === 'patient'
    ? buildTestFilter({ clinicId, userId, params })
    : buildTestFilter({ clinicId, params });

  const count = await Test.countDocuments(filter);
  return { count };
}

// ── Clinic summary ──────────────────────────────────────────────────────────

async function handleClinicSummary({ clinicId, userType, userId }) {
  const clinicData = await handleGetClinic({ clinicId });

  if (userType === 'patient') {
    const testCount = await Test.countDocuments({
      clinic_id: clinicId,
      user_id: userId,
      is_deleted: { $ne: true },
    });
    return { ...clinicData, myTestCount: testCount };
  }

  const [patientCount, testCount] = await Promise.all([
    User.countDocuments({ clinic_id: clinicId, user_type: 'patient' }),
    Test.countDocuments({ clinic_id: clinicId, is_deleted: { $ne: true } }),
  ]);
  return { ...clinicData, patientCount, testCount };
}

// ── Staff: patient detail with tests ────────────────────────────────────────

async function handlePatientDetailWithTests({ params, clinicId }) {
  let patient;
  if (params.phone) {
    patient = await User.findOne({ clinic_id: clinicId, user_type: 'patient', phone: params.phone }).lean();
  } else if (params.email) {
    patient = await User.findOne({ clinic_id: clinicId, user_type: 'patient', email: params.email }).lean();
  } else if (params.name) {
    patient = await User.findOne({ clinic_id: clinicId, user_type: 'patient', name: new RegExp(params.name, 'i') }).lean();
  }

  if (!patient) return { patient: null, tests: [] };

  const filter = buildTestFilter({ clinicId, userId: patient._id, params });
  const tests = await Test.find(filter).sort({ created_at: -1 }).limit(DEFAULT_LIMIT).lean();

  return { patient: formatUser(patient), tests: formatTests(tests) };
}

// ── Unsupported ─────────────────────────────────────────────────────────────

async function handleUnsupported() {
  return { message: 'unsupported_intent' };
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function buildTestFilter({ clinicId, userId, params = {} }) {
  const filter = { clinic_id: clinicId, is_deleted: { $ne: true } };

  if (userId) filter.user_id = userId;

  if (params.date_from || params.date_to) {
    filter.created_at = {};
    if (params.date_from) filter.created_at.$gte = new Date(params.date_from);
    if (params.date_to) filter.created_at.$lte = new Date(params.date_to);
  }

  if (params.hba1c_gt != null || params.hba1c_lt != null) {
    filter.hba1c_value = {};
    if (params.hba1c_gt != null) filter.hba1c_value.$gt = params.hba1c_gt;
    if (params.hba1c_lt != null) filter.hba1c_value.$lt = params.hba1c_lt;
  }

  if (params.test_type) filter.test_type = params.test_type;

  return filter;
}

function buildSort(params = {}) {
  const field = params.sort_by || 'created_at';
  const order = params.sort_order === 'asc' ? 1 : -1;
  return { [field]: order };
}

function formatUser(user) {
  if (!user) return null;
  return {
    id: user._id,
    name: user.name,
    phone: user.phone,
    email: user.email || null,
    gender: user.gender,
    dob: user.dob,
    user_type: user.user_type,
  };
}

function formatTests(tests) {
  return tests.map(t => ({
    id: t._id,
    user_name: t.user_data?.name || null,
    test_type: t.test_type,
    hba1c: t.hba1c,
    hba1c_value: t.hba1c_value,
    hba1c_result: t.hba1c_result,
    date: t.created_at,
  }));
}
