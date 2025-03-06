import prisma from "@/lib/prisma.js"; 

async function setupPasswordTrigger() {
  await prisma.$executeRawUnsafe(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION hash_password_function()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.password := crypt(NEW.password, gen_salt('bf')); 
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await prisma.$executeRawUnsafe(`
    DO $$ 
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'hash_password_trigger') THEN
        CREATE TRIGGER hash_password_trigger
        BEFORE INSERT OR UPDATE ON "user"
        FOR EACH ROW
        EXECUTE FUNCTION hash_password_function();
      END IF;
    END $$;
  `);
}

setupPasswordTrigger().then(() => {
  console.log("✅ Hash Trigger setup successfully");
}).catch((err) => {
  console.error("❌ Error setup trigger:", err);
});
