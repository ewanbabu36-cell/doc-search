import { getDatabase } from '../packages/database/dist/index.js';
import { partnerProfiles } from '../packages/database/dist/schema/index.js';
import { eq, or, ilike } from 'drizzle-orm';

async function test() {
  const db = getDatabase();
  console.log('Database connected:', !!db);
  const partners = await db.select().from(partnerProfiles).where(ilike(partnerProfiles.tradeName, '%metropolis%')).limit(5);
  console.log('Found partners count:', partners.length);
  for (const p of partners) {
    console.log('ID:', p.id);
    console.log('tradeName:', p.tradeName);
    console.log('primaryContactEmail:', p.primaryContactEmail);
    console.log('metadata type:', typeof p.metadata, p.metadata);
  }

  // Also query by email 'labtech@metropolis.com'
  const byEmail = await db.select().from(partnerProfiles).where(eq(partnerProfiles.primaryContactEmail, 'labtech@metropolis.com')).limit(5);
  console.log('Found by email count:', byEmail.length);

  // If no partner by metropolis, check all partners in partnerProfiles
  const allPartners = await db.select({ id: partnerProfiles.id, name: partnerProfiles.tradeName, email: partnerProfiles.primaryContactEmail }).from(partnerProfiles).limit(10);
  console.log('All partners sample (10):', allPartners);
}
test().catch(console.error);
