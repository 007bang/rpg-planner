import { useEffect, useRef } from 'react'
import { useCharacter } from '../hooks/useStudies'
import { db } from '../db/db'

const JOB_EMOJI = { warrior: '⚔️', mage: '🧙', archer: '🏹' }

/* ── canvas 고정 해상도 ─────────────────────────── */
const CW = 600, CH = 300
const WALL_H = Math.round(CH * 0.52)   // 156

/* 창문 공통 치수 */
const WIN_Y = 16, WIN_W = 85, WIN_H = 88
const L_WIN_X = 14
const R_WIN_X = CW - 99

/* ── 책상 레이아웃 (드래그 히트 검사에도 사용) ──────── */
const D_W = 58, D_H = 22
const MARGIN_X = 80
const C_SPACE = (CW - MARGIN_X * 2) / 3
const COL_XS = [0, 1, 2].map(c => Math.round(MARGIN_X + C_SPACE * c + (C_SPACE - D_W) / 2))
const FLOOR_AVAIL = CH - WALL_H - 8
const R_SPACE = FLOOR_AVAIL / 3
const ROW_YS = [0, 1, 2].map(r => Math.round(WALL_H + R_SPACE * r + 18))

/* ── 창문 하나 그리기 ──────────────────────────────── */
function drawWindow(ctx, wx) {
  ctx.save()
  ctx.beginPath()
  ctx.rect(wx, WIN_Y, WIN_W, WIN_H)
  ctx.clip()

  const skyGrad = ctx.createLinearGradient(0, WIN_Y, 0, WIN_Y + WIN_H)
  skyGrad.addColorStop(0, '#A8D4F0')
  skyGrad.addColorStop(1, '#C8E8F8')
  ctx.fillStyle = skyGrad
  ctx.fillRect(wx, WIN_Y, WIN_W, WIN_H)

  ctx.fillStyle = 'rgba(255,255,255,0.88)'
  ;[
    [wx + 22, WIN_Y + 22, 10],
    [wx + 36, WIN_Y + 16, 13],
    [wx + 52, WIN_Y + 22, 10],
  ].forEach(([cx, cy, r]) => {
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill()
  })

  const tx = wx + WIN_W / 2
  ctx.fillStyle = '#6B4C2A'
  ctx.fillRect(tx - 4, WIN_Y + 65, 8, WIN_H - 63)
  ctx.fillStyle = '#4A8B3A'
  ctx.beginPath(); ctx.arc(tx, WIN_Y + 58, 20, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#3D7730'
  ctx.beginPath(); ctx.arc(tx, WIN_Y + 44, 14, 0, Math.PI * 2); ctx.fill()

  ctx.restore()

  ctx.strokeStyle = '#8B7050'; ctx.lineWidth = 4
  ctx.strokeRect(wx, WIN_Y, WIN_W, WIN_H)
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(wx + WIN_W / 2, WIN_Y)
  ctx.lineTo(wx + WIN_W / 2, WIN_Y + WIN_H)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(wx, WIN_Y + WIN_H / 2)
  ctx.lineTo(wx + WIN_W, WIN_Y + WIN_H / 2)
  ctx.stroke()
}

/* ── 책상 하나 그리기 ────────────────────────────── */
function drawDesk(ctx, dx, dy, dw, dh) {
  ctx.fillStyle = 'rgba(0,0,0,0.07)'
  ctx.fillRect(dx + 4, dy + dh + 6, dw, 3)

  ctx.fillStyle = '#C9965A'
  ctx.fillRect(dx, dy, dw, dh)

  ctx.fillStyle = '#A07840'
  ctx.fillRect(dx, dy + dh, dw, 5)

  ctx.strokeStyle = '#7A5C30'; ctx.lineWidth = 1.5
  ctx.strokeRect(dx, dy, dw, dh)

  ctx.strokeStyle = '#7A5C30'; ctx.lineWidth = 2
  ;[[dx + 9, dx + 9], [dx + dw - 9, dx + dw - 9]].forEach(([x]) => {
    ctx.beginPath()
    ctx.moveTo(x, dy + dh + 5)
    ctx.lineTo(x, dy + dh + 13)
    ctx.stroke()
  })
}

/* ── 전체 씬 그리기 ──────────────────────────────── */
function drawScene(ctx, job, avatar, deskRow = 1, deskCol = 1, dragPos = null, hoverDesk = null) {
  ctx.clearRect(0, 0, CW, CH)

  /* 벽 */
  ctx.fillStyle = '#F4EFE6'
  ctx.fillRect(0, 0, CW, WALL_H)

  /* 바닥 */
  const floorGrad = ctx.createLinearGradient(0, WALL_H, 0, CH)
  floorGrad.addColorStop(0, '#C8905A')
  floorGrad.addColorStop(1, '#D9A870')
  ctx.fillStyle = floorGrad
  ctx.fillRect(0, WALL_H, CW, CH - WALL_H)

  /* 바닥 나무판 선 */
  ctx.strokeStyle = 'rgba(0,0,0,0.06)'; ctx.lineWidth = 1
  for (let y = WALL_H + 16; y < CH; y += 18) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CW, y); ctx.stroke()
  }

  /* 걸레받이 */
  ctx.fillStyle = '#A87845'
  ctx.fillRect(0, WALL_H - 7, CW, 8)

  /* 창문 */
  drawWindow(ctx, L_WIN_X)
  drawWindow(ctx, R_WIN_X)

  /* 칠판 */
  const BB_X = Math.round(CW * 0.265)
  const BB_W = Math.round(CW * 0.47)
  const BB_Y = 12
  const BB_H = Math.round(WALL_H * 0.60)

  ctx.fillStyle = 'rgba(0,0,0,0.10)'
  ctx.fillRect(BB_X + 4, BB_Y + 4, BB_W, BB_H)
  ctx.fillStyle = '#2D6B25'
  ctx.fillRect(BB_X, BB_Y, BB_W, BB_H)

  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1
  ctx.setLineDash([8, 6])
  for (let y = BB_Y + 20; y < BB_Y + BB_H - 8; y += 16) {
    ctx.beginPath(); ctx.moveTo(BB_X + 14, y); ctx.lineTo(BB_X + BB_W - 14, y); ctx.stroke()
  }
  ctx.setLineDash([])

  ctx.strokeStyle = '#9B7728'; ctx.lineWidth = 5
  ctx.strokeRect(BB_X, BB_Y, BB_W, BB_H)

  ctx.fillStyle = '#B89050'
  ctx.fillRect(BB_X, BB_Y + BB_H, BB_W, 5)
  ctx.fillStyle = '#E8E0D0'
  ctx.fillRect(BB_X + 10, BB_Y + BB_H + 1, 20, 3)

  ctx.font = 'bold 15px sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.60)'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('📚  열공 중!', BB_X + BB_W / 2, BB_Y + BB_H * 0.50)

  /* 책상 3×3 */
  const jobEmoji    = JOB_EMOJI[job] ?? '📚'
  const personEmoji = avatar ?? '🧑'

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const dx = COL_XS[c]
      const dy = ROW_YS[r]

      /* 드롭 대상 하이라이트 */
      if (hoverDesk?.r === r && hoverDesk?.c === c) {
        ctx.fillStyle = 'rgba(99,102,241,0.18)'
        ctx.fillRect(dx - 4, dy - 32, D_W + 8, D_H + 36)
      }

      drawDesk(ctx, dx, dy, D_W, D_H)

      /* 아바타 — 드래그 중이 아닐 때만 책상 위에 */
      if (r === deskRow && c === deskCol && !dragPos) {
        const cx = dx + D_W / 2
        ctx.textAlign = 'center'
        ctx.textBaseline = 'bottom'
        ctx.font = '24px serif'
        ctx.fillText(personEmoji, cx, dy - 1)
        ctx.font = '13px serif'
        ctx.fillText(jobEmoji, cx + 16, dy - 22)
      }
    }
  }

  /* 드래그 중 커서 위치에 아바타 */
  if (dragPos) {
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'
    ctx.font = '24px serif'
    ctx.fillText(personEmoji, dragPos.x, dragPos.y)
    ctx.font = '13px serif'
    ctx.fillText(jobEmoji, dragPos.x + 16, dragPos.y - 21)
  }
}

/* ── 컴포넌트 ─────────────────────────────────────── */
export default function ClassroomCanvas() {
  const canvasRef  = useRef(null)
  const dragRef    = useRef({ active: false, x: 0, y: 0, hoverDesk: null })
  const characters = useCharacter()
  const character  = characters?.[0] ?? null
  const job        = character?.job     ?? null
  const avatar     = character?.avatar  ?? '🧑'
  const deskRow    = character?.deskRow ?? 1
  const deskCol    = character?.deskCol ?? 1

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    drawScene(canvas.getContext('2d'), job, avatar, deskRow, deskCol, null, null)
  }, [job, avatar, deskRow, deskCol])

  /* 마우스/터치 → 캔버스 좌표 변환 */
  function toCanvas(e) {
    const canvas = canvasRef.current
    const rect   = canvas.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) * (CW / rect.width),
      y: (e.clientY - rect.top)  * (CH / rect.height),
    }
  }

  /* 캔버스 좌표 → 해당 책상 {r, c} or null */
  function getDeskAt(x, y) {
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const dx = COL_XS[c], dy = ROW_YS[r]
        if (x >= dx - 6 && x <= dx + D_W + 6 && y >= dy - 32 && y <= dy + D_H + 6) {
          return { r, c }
        }
      }
    }
    return null
  }

  function handlePointerDown(e) {
    const { x, y } = toCanvas(e)
    /* 아바타 중심에서 22px 이내만 드래그 시작 */
    const cx = COL_XS[deskCol] + D_W / 2
    const cy = ROW_YS[deskRow] - 13
    if (Math.hypot(x - cx, y - cy) > 22) return
    dragRef.current = { active: true, x, y, hoverDesk: null }
    canvasRef.current.setPointerCapture(e.pointerId)
    e.preventDefault()
  }

  function handlePointerMove(e) {
    if (!dragRef.current.active) return
    const { x, y } = toCanvas(e)
    const hoverDesk = getDeskAt(x, y)
    dragRef.current.x = x
    dragRef.current.y = y
    dragRef.current.hoverDesk = hoverDesk
    drawScene(canvasRef.current.getContext('2d'), job, avatar, deskRow, deskCol, { x, y }, hoverDesk)
    e.preventDefault()
  }

  async function handlePointerUp(e) {
    if (!dragRef.current.active) return
    const { x, y } = toCanvas(e)
    const target = getDeskAt(x, y)
    dragRef.current = { active: false, x: 0, y: 0, hoverDesk: null }

    if (target && character && (target.r !== deskRow || target.c !== deskCol)) {
      await db.characters.update(character.id, { deskRow: target.r, deskCol: target.c })
      /* useLiveQuery가 재렌더링 → useEffect가 다시 drawScene 호출 */
    } else {
      drawScene(canvasRef.current.getContext('2d'), job, avatar, deskRow, deskCol, null, null)
    }
  }

  return (
    <div className="mx-4 mt-4 rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
      <canvas
        ref={canvasRef}
        width={CW}
        height={CH}
        style={{ width: '100%', height: 'auto', display: 'block', touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
    </div>
  )
}
