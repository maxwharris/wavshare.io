const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTags() {
  try {
    console.log('Checking all tags in database:');
    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: {
            postTags: true
          }
        }
      }
    });
    
    console.log('Total tags:', tags.length);
    tags.forEach(tag => {
      console.log(`- "${tag.name}" (ID: ${tag.id}, Posts: ${tag._count.postTags})`);
    });
    
    console.log('\nChecking posts with tags:');
    const posts = await prisma.post.findMany({
      include: {
        postTags: {
          include: {
            tag: true
          }
        }
      }
    });
    
    posts.forEach(post => {
      if (post.postTags.length > 0) {
        console.log(`Post "${post.title}" has tags:`, post.postTags.map(pt => pt.tag.name));
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTags();
