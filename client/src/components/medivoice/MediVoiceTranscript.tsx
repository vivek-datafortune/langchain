import type { CSSProperties } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ScrollShadow } from '@heroui/react'
import type { Phase } from './constants'
import type { EnquiryStage, EnquiryResult } from '../../lib/api'

export interface MediVoiceTranscriptProps {
  phase: Phase
  displayTranscript: string
  stageInfo: EnquiryStage | null
  enquiryResult: EnquiryResult | null
}

const EASE = [0.32, 0.72, 0, 1] as const

const phaseConfig = {
  listening: { label: 'Live Transcript', dotColor: 'bg-emerald-400', pulse: true },
  processing: { label: 'Processing',     dotColor: 'bg-cyan-400',    pulse: true },
  idle:       { label: 'Response',        dotColor: 'bg-violet-400',  pulse: false },
}

// Each list item = its own box. 3 alternating colors, full border (no parent box).
const LIST_CARD_BASE = 'rounded-lg backdrop-blur-md overflow-hidden border'
const CARD_TINTS: Array<{ bg: string; border: string }> = [
  { bg: 'rgba(139, 92, 246, 0.08)', border: 'rgba(139, 92, 246, 0.4)' },
  { bg: 'rgba(6, 182, 212, 0.07)', border: 'rgba(6, 182, 212, 0.35)' },
  { bg: 'rgba(52, 211, 153, 0.07)', border: 'rgba(52, 211, 153, 0.35)' },
]
function getListCardStyle(i: number): CSSProperties {
  const t = CARD_TINTS[i % CARD_TINTS.length]
  return { background: t.bg, borderColor: t.border, borderWidth: 1, borderStyle: 'solid' }
}
// Single/text card: one subtle violet AI tint
const SINGLE_CARD_BASE = 'rounded-xl border border-white/10 backdrop-blur-md'
const SINGLE_CARD_STYLE: CSSProperties = {
  background: 'rgba(139, 92, 246, 0.06)',
  borderLeft: '3px solid rgba(139, 92, 246, 0.4)',
}

// Framer Motion: list stagger
const listVariants = {
  visible: {
    transition: { staggerChildren: 0.05, delayChildren: 0.02 },
  },
}
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE } },
}

type DataItem = Record<string, unknown>

function isPatientLike(o: DataItem): boolean {
  return typeof o.name === 'string' && (o.phone != null || o.dob != null || o.gender != null)
}

function isTestLike(o: DataItem): boolean {
  return o.test_type != null || o.hba1c_result != null || o.date != null
}

function getListItems(data: Record<string, unknown>): DataItem[] | null {
  if (Array.isArray(data.patients)) return data.patients as DataItem[]
  if (Array.isArray(data.tests)) return data.tests as DataItem[]
  return null
}

function formatDate(v: unknown): string {
  if (v == null) return '—'
  if (typeof v === 'string') {
    const d = new Date(v)
    return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleDateString()
  }
  return String(v)
}

export function MediVoiceTranscript({
  phase,
  displayTranscript,
  stageInfo,
  enquiryResult,
}: MediVoiceTranscriptProps) {
  const cfg = phaseConfig[phase]

  return (
    <div className="flex flex-col h-full min-h-0">

      {/* ── Panel header ─────────────────────────────────────── */}
      <div className="flex items-center gap-2.5 px-5 pt-5 pb-3.5 border-b border-white/6">
        <motion.span
          className={`block h-1.5 w-1.5 rounded-full ${cfg.dotColor} shrink-0`}
          animate={
            cfg.pulse
              ? { scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }
              : { scale: 1, opacity: 0.7 }
          }
          transition={{ duration: 1.4, repeat: cfg.pulse ? Infinity : 0, ease: 'easeInOut' }}
        />
        <AnimatePresence mode="wait">
          <motion.p
            key={cfg.label}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.2, ease: EASE } }}
            exit={{ opacity: 0, y: -3, transition: { duration: 0.15 } }}
            className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/30 select-none"
          >
            {cfg.label}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* ── Scrollable content ───────────────────────────────── */}
      <ScrollShadow className="flex-1 overflow-y-auto min-h-0 px-5 py-5">
        <AnimatePresence mode="wait">

          {/* Listening — live transcript stream */}
          {phase === 'listening' && displayTranscript && (
            <motion.div
              key="live"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE } }}
              exit={{ opacity: 0, transition: { duration: 0.18 } }}
            >
              <p className="text-sm leading-7 text-white/70 font-light">
                {displayTranscript}
                <motion.span
                  className="inline-block ml-0.5 h-[14px] w-[2px] rounded-full bg-emerald-400 align-middle"
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                />
              </p>
            </motion.div>
          )}

          {/* Listening — waiting for speech */}
          {phase === 'listening' && !displayTranscript && (
            <motion.p
              key="listening-idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.25 } }}
              exit={{ opacity: 0 }}
              className="text-xs text-white/25 italic"
            >
              Waiting for speech…
            </motion.p>
          )}

          {/* Processing — animated dots + stage message */}
          {phase === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.25 } }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center gap-4 py-8"
            >
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-cyan-400"
                    animate={{ scale: [1, 1.6, 1], opacity: [0.35, 1, 0.35] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.18 }}
                  />
                ))}
              </div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={stageInfo?.message ?? 'waiting'}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: 0.2 } }}
                  exit={{ opacity: 0, y: -4, transition: { duration: 0.15 } }}
                  className="text-xs text-white/30 text-center"
                >
                  {stageInfo?.message ?? 'Sending to AI…'}
                </motion.p>
              </AnimatePresence>
            </motion.div>
          )}

          {/* Idle — AI response */}
          {phase === 'idle' && enquiryResult && (
            <ResponseBlock key="result" enquiryResult={enquiryResult} />
          )}

          {/* Idle — no result yet */}
          {phase === 'idle' && !enquiryResult && (
            <motion.p
              key="idle-empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs text-white/20 italic"
            >
              Your response will appear here.
            </motion.p>
          )}

        </AnimatePresence>
      </ScrollShadow>

    </div>
  )
}

// ── Response block: quote + branch on response_type (json vs text) ───────────
function ResponseBlock({ enquiryResult }: { enquiryResult: EnquiryResult }) {
  const isJson = enquiryResult.response_type === 'json' && enquiryResult.data != null
  const data = enquiryResult.data as Record<string, unknown> | undefined
  const items = data ? getListItems(data) : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE } }}
      exit={{ opacity: 0, y: -8, transition: { duration: 0.22 } }}
      className="flex flex-col gap-4"
    >
      {enquiryResult.transcription && (
        <>
          <div className="flex gap-3">
            <div className="mt-0.5 w-[2px] shrink-0 rounded-full bg-violet-400/40" />
            <p className="text-[11px] leading-5 text-white/35 italic font-light">
              &ldquo;{enquiryResult.transcription}&rdquo;
            </p>
          </div>
          <div className="h-px w-full bg-white/5" />
        </>
      )}

      {isJson && items && items.length > 0 ? (
        <motion.div
          className="flex flex-col gap-3"
          variants={listVariants}
          initial="hidden"
          animate="visible"
        >
          {items.map((item, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              className={`${LIST_CARD_BASE} px-3 py-2.5`}
              style={getListCardStyle(i)}
            >
              {isPatientLike(item as DataItem) ? (
                <PatientCard item={item as DataItem} />
              ) : isTestLike(item as DataItem) ? (
                <TestCard item={item as DataItem} />
              ) : (
                <KeyValueCard item={item as DataItem} />
              )}
            </motion.div>
          ))}
        </motion.div>
      ) : isJson && data && typeof data === 'object' && !Array.isArray(data) ? (
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className={`${SINGLE_CARD_BASE} px-4 py-3.5`}
          style={SINGLE_CARD_STYLE}
        >
          <SingleEntityCard data={data} />
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE } }}
          className={`${SINGLE_CARD_BASE} px-4 py-3.5`}
          style={SINGLE_CARD_STYLE}
        >
          <p className="text-sm leading-6 text-white/85 font-light whitespace-pre-wrap">
            {enquiryResult.reply}
          </p>
        </motion.div>
      )}
    </motion.div>
  )
}

function PatientCard({ item }: { item: DataItem }) {
  const name = String(item.name ?? '—')
  const phone = item.phone != null ? String(item.phone) : null
  const gender = item.gender != null ? String(item.gender) : null
  const dob = item.dob != null ? formatDate(item.dob) : null
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-semibold text-white/90 leading-tight">{name}</p>
      <div className="flex flex-wrap gap-x-2.5 gap-y-0 text-[11px] text-white/45">
        {phone && <span>{phone}</span>}
        {gender && <span>{gender}</span>}
        {dob && <span>DOB: {dob}</span>}
      </div>
    </div>
  )
}

function TestCard({ item }: { item: DataItem }) {
  const user = item.user_name ?? item.user_id ?? '—'
  const type = item.test_type ?? '—'
  const result = item.hba1c_result ?? item.hba1c_value ?? item.hba1c
  const date = formatDate(item.date ?? item.created_at)
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-semibold text-white/90 leading-tight">{String(user)}</p>
      <div className="flex flex-wrap gap-x-2.5 gap-y-0 text-[11px] text-white/45">
        <span>{String(type)}</span>
        {result != null && <span>HbA1c: {String(result)}</span>}
        <span>{date}</span>
      </div>
    </div>
  )
}

function KeyValueCard({ item }: { item: DataItem }) {
  const entries = Object.entries(item).filter(
    ([k, v]) => v != null && v !== '' && k !== '_id' && k !== 'id'
  )
  return (
    <div className="flex flex-col gap-1.5">
      {entries.map(([key, value]) => (
        <div key={key} className="flex justify-between gap-2 text-[11px]">
          <span className="text-white/45 capitalize shrink-0">{key.replace(/_/g, ' ')}</span>
          <span className="text-white/80 text-right truncate min-w-0">
            {String(
              typeof value === 'object' && value !== null && !(value instanceof Date)
                ? JSON.stringify(value)
                : (value ?? '')
            )}
          </span>
        </div>
      ))}
    </div>
  )
}

function SingleEntityCard({ data }: { data: Record<string, unknown> }) {
  const flat: Array<{ key: string; value: unknown }> = []
  function walk(obj: Record<string, unknown>, prefix: string) {
    for (const [k, v] of Object.entries(obj)) {
      if (v == null || k === '_id' || k === 'id') continue
      if (typeof v === 'object' && v !== null && !Array.isArray(v) && !(v instanceof Date)) {
        walk(v as Record<string, unknown>, prefix + k + ' — ')
      } else {
        flat.push({ key: prefix + k.replace(/_/g, ' '), value: v })
      }
    }
  }
  walk(data, '')
  return (
    <div className="flex flex-col gap-1.5">
      {flat.map(({ key, value }) => (
        <div key={key} className="flex justify-between gap-2 text-xs">
          <span className="text-white/45 capitalize shrink-0">{key}</span>
          <span className="text-white/80 text-right truncate min-w-0">
            {Array.isArray(value) ? value.length + ' item(s)' : String(value ?? '')}
          </span>
        </div>
      ))}
    </div>
  )
}
