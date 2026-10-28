/**
 * audio-utils.js — Decode, draw and encode audio in the browser
 */

let ctx = null;
export function audioContext() {
    if (!ctx || ctx.state === 'closed') ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
}

export async function decodeFile(file) {
    return audioContext().decodeAudioData(await file.arrayBuffer());
}

/** 16-bit PCM WAV from an AudioBuffer. */
export function encodeWav(buf) {
    const ch = buf.numberOfChannels;
    const len = buf.length * ch * 2;
    const out = new DataView(new ArrayBuffer(44 + len));
    const str = (o, s) => { for (let i = 0; i < s.length; i++) out.setUint8(o + i, s.charCodeAt(i)); };
    str(0, 'RIFF'); out.setUint32(4, 36 + len, true); str(8, 'WAVE'); str(12, 'fmt ');
    out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, ch, true);
    out.setUint32(24, buf.sampleRate, true); out.setUint32(28, buf.sampleRate * ch * 2, true);
    out.setUint16(32, ch * 2, true); out.setUint16(34, 16, true); str(36, 'data'); out.setUint32(40, len, true);
    const data = [...Array(ch)].map((_, c) => buf.getChannelData(c));
    let o = 44;
    for (let i = 0; i < buf.length; i++) {
        for (let c = 0; c < ch; c++) {
            const s = Math.max(-1, Math.min(1, data[c][i]));
            out.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true);
            o += 2;
        }
    }
    return new Blob([out.buffer], { type: 'audio/wav' });
}

/** Min/max peaks per pixel column, all channels mixed. */
export function peaks(buf, columns) {
    const per = Math.max(1, Math.floor(buf.length / columns));
    const chans = [...Array(buf.numberOfChannels)].map((_, c) => buf.getChannelData(c));
    const out = new Float32Array(columns * 2);
    for (let x = 0; x < columns; x++) {
        let lo = 1, hi = -1;
        const start = x * per;
        for (let i = start; i < Math.min(start + per, buf.length); i += Math.max(1, per >> 6)) {
            for (const d of chans) { const v = d[i]; if (v < lo) lo = v; if (v > hi) hi = v; }
        }
        out[x * 2] = lo; out[x * 2 + 1] = hi;
    }
    return out;
}

export function drawWave(canvas, buf, { color = '#60a5fa', bg = 'transparent' } = {}) {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    const g = canvas.getContext('2d');
    g.scale(dpr, dpr);
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    const p = peaks(buf, Math.max(1, Math.floor(w)));
    g.fillStyle = color;
    for (let x = 0; x < w; x++) {
        const lo = p[x * 2], hi = p[x * 2 + 1];
        const y1 = (1 - hi) * h / 2, y2 = (1 - lo) * h / 2;
        g.fillRect(x, y1, 1, Math.max(1, y2 - y1));
    }
}

export function peakLevel(buf) {
    let m = 0;
    for (let c = 0; c < buf.numberOfChannels; c++) {
        const d = buf.getChannelData(c);
        for (let i = 0; i < d.length; i++) { const v = Math.abs(d[i]); if (v > m) m = v; }
    }
    return m;
}

export const dbfs = (v) => (v > 0 ? 20 * Math.log10(v) : -Infinity);
export const fmtTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toFixed(2).padStart(5, '0')}`;
