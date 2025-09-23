function Row({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: "flex",
      gap: 50,
      flexWrap: "wrap",
      marginBottom: 10
    }}>
      {children}
    </div>
  );
}
export default Row;