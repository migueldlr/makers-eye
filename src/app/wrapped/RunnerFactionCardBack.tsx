"use client";

export default function RunnerFactionCardBack() {
  const icons = [
    {
      name: "Anarch",
      color: "#FF6B00",
      src: "/icons/NSG_ANARCH.svg",
    },
    {
      name: "Criminal",
      color: "#44A8FF",
      src: "/icons/NSG_CRIMINAL.svg",
    },
    {
      name: "Shaper",
      color: "#1ECB8A",
      src: "/icons/NSG_SHAPER.svg",
    },
  ];

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        borderRadius: 18,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.5rem",
      }}
    >
      {icons.map((icon) => (
        <div
          key={icon.name}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.25rem",
          }}
        >
          <img
            src={icon.src}
            alt={`${icon.name} symbol`}
            style={{ width: 72, height: 72, objectFit: "contain" }}
          />
        </div>
      ))}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          borderRadius: 18,
        }}
      />
    </div>
  );
}
