async function check() {
  const res = await fetch('http://localhost:4000/api/v1/company/partners/directory?page=1&pageSize=1000');
  const json = await res.json();
  console.log(`Total partners in running server directory: ${json.data?.length}`);
  json.data?.forEach((p, idx) => {
    console.log(`${idx + 1}. [${p.id}] "${p.tradeName}" | email: ${p.primaryContact?.email} | slug: ${p.tenantSlug} | source: ${p.registeredBy?.source}`);
  });
}
check().catch(console.error);
