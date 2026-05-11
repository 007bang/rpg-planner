import { useEffect, useRef } from 'react'
import { useCharacter } from '../hooks/useStudies'

const JOB_EMOJI = { warrior: '⚔️', mage: '🧙', archer: '🏹' }

/* ── canvas 고정 해상도 ─────────────────────────── */
const CW = 600, CH = 300
const WALL_H = Math.round(CH * 0.52)   // 156  (벽 높이)

/* 창문 공통 치수 */
const WIN_Y = 16, WIN_W = 85, WIN_H = 88
const L_WIN_X = 14
const R_WIN_X = CW - 99

/* ── 창문 하나 그리기 (내용 + 프레임) ──────────────── */
function drawWindow(ctx, wx) {
  /* 내용 (sky + cloud + tree) — 창문 영역으로 클리핑 */
  ctx.save()
  ctx.beginPath()
  ctx.rect(wx, WIN_Y, WIN_W, WIN_H)
  ctx.clip()

  /* 하늘 그라데이션 */
  const skyGrad = ctx.createLinearGradient(0, WIN_Y, 0, WIN_Y + WIN_H)
  skyGrad.addColorStop(0, '#A8D4F0')
  skyGrad.addColorStop(1, '#C8E8F8')
  ctx.fillStyle = skyGrad
  ctx.fillRect(wx, WIN_Y, WIN_W, WIN_H)

  /* 구름 */
  ctx.fillStyle = 'rgba(255,255,255,0.88)'
  ;[
    [wx + 22, WIN_Y + 22, 10],
    [wx + 36, WIN_Y + 16, 13],
    [wx + 52, WIN_Y + 22, 10],
  ].forEach(([cx, cy, r]) => {
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill()
  })

  /* 나무 줄기 */
  const tx = wx + WIN_W / 2
  ctx.fillStyle = '#6B4C2A'
  ctx.fillRect(tx - 4, WIN_Y + 65, 8, WIN_H - 63)

  /* 나무 잎 */
  ctx.fillStyle = '#4A8B3A'
  ctx.beginPath(); ctx.arc(tx, WIN_Y + 58, 20, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#3D7730'
  ctx.beginPath(); ctx.arc(tx, WIN_Y + 44, 14, 0, Math.PI * 2); ctx.fill()

  ctx.restore()

  /* 창문 프레임 */
  ctx.strokeStyle = '#8B7050'; ctx.lineWidth = 4
  ctx.strokeRect(wx, WIN_Y, WIN_W, WIN_H)
  ctx.lineWidth = 2
  /* 가로/세로 분할선 */
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
  /* 그림자 */
  ctx.fillStyle = 'rgba(0,0,0,0.07)'
  ctx.fillRect(dx + 4, dy + dh + 6, dw, 3)

  /* 책상 상판 */
  ctx.fillStyle = '#C9965A'
  ctx.fillRect(dx, dy, dw, dh)

  /* 앞면 두께 */
  ctx.fillStyle = '#A07840'
  ctx.fillRect(dx, dy + dh, dw, 5)

  /* 외곽선 */
  ctx.strokeStyle = '#7A5C30'; ctx.lineWidth = 1.5
  ctx.strokeRect(dx, dy, dw, dh)

  /* 다리 */
  ctx.strokeStyle = '#7A5C30'; ctx.lineWidth = 2
  ;[[dx + 9, dx + 9], [dx + dw - 9, dx + dw - 9]].forEach(([x]) => {
    ctx.beginPath()
    ctx.moveTo(x, dy + dh + 5)
    ctx.lineTo(x, dy + dh + 13)
    ctx.stroke()
  })
}

/* ── 전체 씬 그리기 ──────────────────────────────── */
function drawScene(ctx, job) {
  ctx.clearRect(0, 0, CW, CH)

  /* 1. 벽 (크림) */
  ctx.fillStyle = '#F4EFE6'
  ctx.fillRect(0, 0, CW, WALL_H)

  /* 2. 바닥 (나무 그라데이션) */
  const floorGrad = ctx.createLinearGradient(0, WALL_H, 0, CH)
  floorGrad.addColorStop(0, '#C8905A')
  floorGrad.addColorStop(1, '#D9A870')
  ctx.fillStyle = floorGrad
  ctx.fillRect(0, WALL_H, CW, CH - WALL_H)

  /* 3. 바닥 나무판 선 */
  ctx.strokeStyle = 'rgba(0,0,0,0.06)'; ctx.lineWidth = 1
  for (let y = WALL_H + 16; y < CH; y += 18) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CW, y); ctx.stroke()
  }

  /* 4. 걸레받이 */
  ctx.fillStyle = '#A87845'
  ctx.fillRect(0, WALL_H - 7, CW, 8)

  /* 5. 창문 (좌/우) */
  drawWindow(ctx, L_WIN_X)
  drawWindow(ctx, R_WIN_X)

  /* 6. 칠판 */
  const BB_X = Math.round(CW * 0.265)
  const BB_W = Math.round(CW * 0.47)
  const BB_Y = 12
  const BB_H = Math.round(WALL_H * 0.60)  // ~94

  /* 칠판 그림자 */
  ctx.fillStyle = 'rgba(0,0,0,0.10)'
  ctx.fillRect(BB_X + 4, BB_Y + 4, BB_W, BB_H)

  /* 칠판 본체 */
  ctx.fillStyle = '#2D6B25'
  ctx.fillRect(BB_X, BB_Y, BB_W, BB_H)

  /* 분필 가로선 */
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1
  ctx.setLineDash([8, 6])
  for (let y = BB_Y + 20; y < BB_Y + BB_H - 8; y += 16) {
    ctx.beginPath(); ctx.moveTo(BB_X + 14, y); ctx.lineTo(BB_X + BB_W - 14, y); ctx.stroke()
  }
  ctx.setLineDash([])

  /* 칠판 액자 */
  ctx.strokeStyle = '#9B7728'; ctx.lineWidth = 5
  ctx.strokeRect(BB_X, BB_Y, BB_W, BB_H)

  /* 분필받이 + 지우개 */
  ctx.fillStyle = '#B89050'
  ctx.fillRect(BB_X, BB_Y + BB_H, BB_W, 5)
  ctx.fillStyle = '#E8E0D0'
  ctx.fillRect(BB_X + 10, BB_Y + BB_H + 1, 20, 3)

  /* 칠판 글씨 */
  ctx.font = 'bold 15px sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.60)'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('📚  열공 중!', BB_X + BB_W / 2, BB_Y + BB_H * 0.50)

  /* 7. 책상 3×3 */
  const D_W = 58, D_H = 22
  const MARGIN_X = 80
  const C_SPACE = (CW - MARGIN_X * 2) / 3
  const COL_XS = [0, 1, 2].map(c => MARGIN_X + C_SPACE * c + (C_SPACE - D_W) / 2)

  const FLOOR_AVAIL = CH - WALL_H - 8
  const R_SPACE = FLOOR_AVAIL / 3
  const ROW_YS = [0, 1, 2].map(r => WALL_H + R_SPACE * r + 18)

  const emoji = JOB_EMOJI[job] ?? '📚'

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const dx = Math.round(COL_XS[c])
      const dy = Math.round(ROW_YS[r])
      drawDesk(ctx, dx, dy, D_W, D_H)

      /* 캐릭터: 가운데 줄(r=1) 중앙 칸(c=1) */
      if (r === 1 && c === 1) {
        ctx.font = '22px serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'bottom'
        ctx.fillStyle = '#000'
        ctx.fillText(emoji, dx + D_W / 2, dy - 2)
      }
    }
  }
}

/* ── 컴포넌트 ─────────────────────────────────────── */
export default function ClassroomCanvas() {
  const canvasRef = useRef(null)
  const characters = useCharacter()
  const job = characters?.[0]?.job ?? null

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    drawScene(canvas.getContext('2d'), job)
  }, [job])

  return (
    <div className="mx-4 mt-4 rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
      <canvas
        ref={canvasRef}
        width={CW}
        height={CH}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      />
    </div>
  )
}
