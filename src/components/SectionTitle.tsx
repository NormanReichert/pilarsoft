function SectionTitle({ children }: { children: string }) {
  return (
    <h3 style={{
      fontSize: 16,
      fontWeight: 700,
      margin: "12px 0 8px" // reduzir margens
    }}>
      {children}
    </h3>
  );
}

export default SectionTitle;