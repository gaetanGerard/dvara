import { PrismaClient, ThemeType } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  // Ensure the default logo exists in assets/logo and is copied to uploads/logo
  const assetsLogoDir = path.join(__dirname, '../../assets/logo');
  const uploadsLogoDir = path.join(__dirname, '../../uploads/logo');
  const defaultLogoFile = 'dvara_app_logo.jpg';
  const defaultLogoSrc = path.join(assetsLogoDir, defaultLogoFile);
  const defaultLogoDest = path.join(uploadsLogoDir, defaultLogoFile);

  if (!fs.existsSync(uploadsLogoDir)) {
    fs.mkdirSync(uploadsLogoDir, { recursive: true });
  }
  if (fs.existsSync(defaultLogoSrc) && !fs.existsSync(defaultLogoDest)) {
    fs.copyFileSync(defaultLogoSrc, defaultLogoDest);
  }

  await prisma.settings.create({
    data: {
      theme: ThemeType.dark,
      title: 'Dvara',
      main_color: '#1a1a1a',
      secondary_color: '#ffb300',
      logo: `/uploads/logo/${defaultLogoFile}`,
      description: '',
      logo_alt: 'logo dvara',
      logo_name: 'Dvara logo',
    },
  });
  console.log('Default settings seeded');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
