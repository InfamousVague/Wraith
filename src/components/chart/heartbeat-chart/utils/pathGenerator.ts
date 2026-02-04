/**
 * SVG path generator for heartbeat animation
 */

/**
 * Generate heartbeat SVG path pattern (ECG waveform)
 * Creates a realistic heartbeat with P wave, QRS complex, and T wave
 */
export function generateHeartbeatPath(svgWidth: number, svgHeight: number): string {
  const midY = svgHeight / 2;
  const segmentWidth = svgWidth / 4; // 4 heartbeat cycles visible
  const spikeHeight = svgHeight * 0.35;

  let path = `M 0 ${midY}`;

  // Generate multiple heartbeat cycles for seamless scrolling
  for (let i = 0; i < 8; i++) {
    const baseX = i * segmentWidth;
    // Flat baseline
    path += ` L ${baseX + segmentWidth * 0.2} ${midY}`;
    // Small dip (P wave)
    path += ` Q ${baseX + segmentWidth * 0.25} ${midY + 5} ${baseX + segmentWidth * 0.3} ${midY}`;
    // Sharp spike up (R wave)
    path += ` L ${baseX + segmentWidth * 0.35} ${midY}`;
    path += ` L ${baseX + segmentWidth * 0.4} ${midY - spikeHeight}`;
    // Sharp spike down (S wave)
    path += ` L ${baseX + segmentWidth * 0.45} ${midY + spikeHeight * 0.5}`;
    // Return to baseline
    path += ` L ${baseX + segmentWidth * 0.5} ${midY}`;
    // T wave bump
    path += ` Q ${baseX + segmentWidth * 0.65} ${midY - 8} ${baseX + segmentWidth * 0.8} ${midY}`;
    // Continue baseline
    path += ` L ${baseX + segmentWidth} ${midY}`;
  }

  return path;
}
