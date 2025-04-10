function handleServerMessage(msg) {
  console.log("Server received:", msg);
  return { ...msg };
}
