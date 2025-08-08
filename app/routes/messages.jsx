useEffect(() => {
  if (!router.isReady) return;
  const { number } = router.query;

  if (!number) {
    router.push("/app/whatsapp"); // if number is missing, go to WhatsApp input page
    return;
  }

  fetchMessages(number);
}, [router.isReady, router.query]);
