import Image from "next/image";

export function AuthBrand() {
  return (
    <div className="flex justify-center">
      <Image
        src="/icons/logo_saveroute_n.png"
        alt="SaveRoute"
        width={204}
        height={40}
        priority
        style={{ height: "40px", width: "auto" }}
      />
    </div>
  );
}
