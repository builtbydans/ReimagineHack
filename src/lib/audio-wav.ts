type AudioBufferSource = Pick<
  AudioBuffer,
  "getChannelData" | "length" | "numberOfChannels" | "sampleRate"
>;

const writeAscii = (view: DataView, offset: number, value: string) => {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
};

export function encodeAudioBufferAsPcmWav(
  audioBuffer: AudioBufferSource,
): ArrayBuffer {
  const bytesPerSample = 2;
  const channelCount = audioBuffer.numberOfChannels;
  const frameCount = audioBuffer.length;
  const blockAlign = channelCount * bytesPerSample;
  const dataSize = frameCount * blockAlign;
  const wavBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(wavBuffer);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channelCount, true);
  view.setUint32(24, audioBuffer.sampleRate, true);
  view.setUint32(28, audioBuffer.sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, dataSize, true);

  const channels = Array.from({ length: channelCount }, (_, channel) =>
    audioBuffer.getChannelData(channel),
  );
  let byteOffset = 44;

  for (let frame = 0; frame < frameCount; frame += 1) {
    for (let channel = 0; channel < channelCount; channel += 1) {
      const sample = Math.max(-1, Math.min(1, channels[channel][frame]));
      const pcmSample = Math.round(
        sample < 0 ? sample * 0x8000 : sample * 0x7fff,
      );
      view.setInt16(byteOffset, pcmSample, true);
      byteOffset += bytesPerSample;
    }
  }

  return wavBuffer;
}

export async function convertAudioBlobToWav(blob: Blob): Promise<Blob> {
  const AudioContextClass =
    window.AudioContext ??
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;

  if (!AudioContextClass) {
    throw new Error("This browser cannot decode the recorded audio.");
  }

  const audioContext = new AudioContextClass();
  try {
    const decodedAudio = await audioContext.decodeAudioData(
      await blob.arrayBuffer(),
    );
    const wavBuffer = encodeAudioBufferAsPcmWav(decodedAudio);
    return new Blob([wavBuffer], { type: "audio/wav" });
  } finally {
    await audioContext.close().catch(() => undefined);
  }
}
