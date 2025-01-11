"use client";

import Image from "next/image";

const HeaderSection = () => (
  <div className="flex items-center gap-4">
    <Image
      src="/abstract.svg"
      alt="Abstract logo"
      width={240}
      height={32}
      quality={100}
      priority
    />
    <span>🤝</span>
    <Image
      src="/rainbow.svg"
      alt="Rainbow logo"
      width={32}
      height={32}
      quality={100}
      priority
    />
  </div>
);

export default HeaderSection;
