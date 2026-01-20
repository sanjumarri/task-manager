const suggestTitleFromDescription = async (description) => {
  const cleaned = (description || "").trim();
  if (!cleaned) {
    return "New Task";
  }
  const words = cleaned.split(/\s+/).slice(0, 6).join(" ");
  return words.length < cleaned.length ? `${words}...` : words;
};

export { suggestTitleFromDescription };
