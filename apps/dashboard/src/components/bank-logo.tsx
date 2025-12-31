import { Avatar, AvatarImage } from "@/components/ui/avatar";

// TODO; SWAP OUT THE DEFAULT IMAGE

type Props = {
  src: string | null;
  alt: string;
  size?: number;
};

export function BankLogo({ src, alt, size = 34 }: Props) {
  return (
    <Avatar style={{ width: size, height: size }}>
      {src && <AvatarImage src={src} alt={alt} />}
      <AvatarImage src="https://cdn-engine.map.ai/default.jpg" alt={alt} />
    </Avatar>
  );
}
