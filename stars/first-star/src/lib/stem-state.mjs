// Mute takes precedence over solo; several channels can be soloed together.
export function channelGain(channels, index) {
  const channel = channels[index];
  return channel.mute || (channels.some((c) => c.solo) && !channel.solo)
    ? 0
    : channel.volume;
}
