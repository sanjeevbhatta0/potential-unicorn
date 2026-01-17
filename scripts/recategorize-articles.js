#!/usr/bin/env node

const { Client } = require('pg');

// Keyword mappings for category detection (supports both English and Nepali)
const CATEGORY_KEYWORDS = {
  'politics': [
    'government', 'minister', 'parliament', 'election', 'vote', 'party', 'political',
    'president', 'prime minister', 'congress', 'legislation', 'policy', 'diplomat',
    'सरकार', 'मन्त्री', 'संसद', 'चुनाव', 'मतदान', 'पार्टी', 'राजनीतिक', 'प्रधानमन्त्री',
    'नेता', 'दल', 'निर्वाचन', 'राष्ट्रपति', 'कांग्रेस', 'एमाले', 'माओवादी', 'सभापति',
    'केन्द्रीय', 'समिति', 'बैठक', 'अध्यक्ष', 'उपाध्यक्ष', 'महासचिव', 'नेकपा'
  ],
  'sports': [
    'football', 'cricket', 'match', 'game', 'player', 'team', 'score', 'goal',
    'tournament', 'championship', 'league', 'athlete', 'coach', 'stadium', 'win', 'loss',
    'खेल', 'फुटबल', 'क्रिकेट', 'खेलाडी', 'टिम', 'गोल', 'प्रतियोगिता', 'च्याम्पियनशिप',
    'विश्वकप', 'ओलम्पिक', 'एसियाड'
  ],
  'entertainment': [
    'movie', 'film', 'actor', 'actress', 'music', 'song', 'concert', 'celebrity',
    'bollywood', 'hollywood', 'tv', 'show', 'drama', 'series', 'singer', 'dance',
    'फिल्म', 'चलचित्र', 'गायक', 'गायिका', 'नायक', 'नायिका', 'गीत', 'संगीत', 'नाटक',
    'कलाकार', 'अभिनेता', 'अभिनेत्री'
  ],
  'business': [
    'economy', 'market', 'stock', 'company', 'business', 'trade', 'investment',
    'finance', 'bank', 'price', 'profit', 'loss', 'industry', 'entrepreneur',
    'अर्थतन्त्र', 'बजार', 'व्यापार', 'कम्पनी', 'बैंक', 'लगानी', 'आर्थिक', 'मूल्य',
    'शेयर', 'नेप्से', 'राष्ट्र बैंक', 'मुद्रास्फीति'
  ],
  'technology': [
    'technology', 'tech', 'software', 'app', 'digital', 'internet', 'computer',
    'ai', 'artificial intelligence', 'mobile', 'startup', 'innovation', 'cyber',
    'प्रविधि', 'टेक्नोलोजी', 'सफ्टवेयर', 'इन्टरनेट', 'डिजिटल', 'मोबाइल', 'एप'
  ],
  'health': [
    'health', 'hospital', 'doctor', 'medical', 'disease', 'treatment', 'patient',
    'medicine', 'vaccine', 'covid', 'virus', 'wellness', 'healthcare',
    'स्वास्थ्य', 'अस्पताल', 'डाक्टर', 'रोग', 'उपचार', 'बिरामी', 'औषधि', 'भ्याक्सिन',
    'चिकित्सक', 'स्वास्थ्य मन्त्रालय'
  ],
  'education': [
    'education', 'school', 'university', 'college', 'student', 'teacher', 'exam',
    'learning', 'academic', 'degree', 'scholarship', 'curriculum',
    'शिक्षा', 'विद्यालय', 'विश्वविद्यालय', 'विद्यार्थी', 'शिक्षक', 'परीक्षा',
    'कलेज', 'क्याम्पस', 'एसईई', 'लोकसेवा'
  ],
  'international': [
    'international', 'world', 'global', 'foreign', 'united nations', 'diplomacy',
    'usa', 'china', 'india', 'europe', 'america', 'asia', 'war', 'conflict',
    'अन्तर्राष्ट्रिय', 'विश्व', 'विदेश', 'भारत', 'चीन', 'अमेरिका', 'युरोप',
    'संयुक्त राष्ट्र', 'विदेश मन्त्री'
  ],
  'opinion': [
    'opinion', 'editorial', 'column', 'analysis', 'perspective', 'commentary',
    'view', 'thought', 'विचार', 'सम्पादकीय', 'विश्लेषण', 'टिप्पणी'
  ],
};

function detectCategory(title, content) {
  const text = `${title} ${content || ''}`.toLowerCase();

  const categoryScores = {};
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        score++;
      }
    }
    if (score > 0) {
      categoryScores[category] = score;
    }
  }

  if (Object.keys(categoryScores).length > 0) {
    // Return category with highest score
    const entries = Object.entries(categoryScores);
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0][0];
  }

  return 'general';
}

async function main() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres123',
    database: process.env.DB_DATABASE || 'nepali_news_dev',
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Get all articles (or just general ones)
    const result = await client.query(`
      SELECT id, title, content, category
      FROM articles
      ORDER BY published_at DESC
    `);

    console.log(`Found ${result.rows.length} articles to process`);

    let updated = 0;
    let unchanged = 0;

    for (const row of result.rows) {
      const newCategory = detectCategory(row.title, row.content);

      if (newCategory !== row.category) {
        await client.query(
          'UPDATE articles SET category = $1 WHERE id = $2',
          [newCategory, row.id]
        );
        console.log(`[UPDATED] "${row.title.substring(0, 40)}..." : ${row.category} -> ${newCategory}`);
        updated++;
      } else {
        unchanged++;
      }
    }

    console.log('\n--- Summary ---');
    console.log(`Total processed: ${result.rows.length}`);
    console.log(`Updated: ${updated}`);
    console.log(`Unchanged: ${unchanged}`);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
    console.log('Disconnected from database');
  }
}

main();
