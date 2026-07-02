type Props = {
  color: string;
  mouth: string;
  size: number;
  eyeMouthColor?: string; // defaults to a dark translucent tone (face on a colored bg)
};

// Ported verbatim from the prototype's inline SVG (viewBox 0 0 100 100).
export default function MoodFace({ color, mouth, size, eyeMouthColor = "rgba(28,22,42,.58)" }: Props) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <circle cx="50" cy="50" r="47" fill={color} />
      <circle cx="37" cy="44" r="5.6" fill={eyeMouthColor} />
      <circle cx="63" cy="44" r="5.6" fill={eyeMouthColor} />
      <path d={mouth} fill="none" stroke={eyeMouthColor} strokeWidth={6.5} strokeLinecap="round" />
    </svg>
  );
}
