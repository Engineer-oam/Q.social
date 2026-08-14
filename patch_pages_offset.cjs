const fs = require('fs');

function replaceLastDoc(filePath) {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, 'utf8');
  
  code = code.replace(/lastDoc/g, 'offset');
  code = code.replace(/setLastDoc/g, 'setOffset');
  code = code.replace(/currentLastDoc/g, 'currentOffset');
  code = code.replace(/newLastDoc/g, 'newOffset');
  
  // Also fix the assignment where the service returns nextOffset instead of offset
  // e.g. const { posts: newPosts, offset: newOffset } -> we need to destructure nextOffset as newOffset
  code = code.replace(/offset: newOffset/g, 'nextOffset: newOffset');
  
  // The state was initialized as null: const [offset, setOffset] = useState<any>(null);
  // Let's change it to 0
  code = code.replace(/useState<any>\(null\)/g, 'useState<number>(0)');
  code = code.replace(/currentOffset = isLoadMore \? offset : undefined;/g, 'currentOffset = isLoadMore ? offset : 0;');
  
  fs.writeFileSync(filePath, code);
}

replaceLastDoc('src/pages/Home.tsx');
replaceLastDoc('src/pages/Explore.tsx');
replaceLastDoc('src/pages/Reels.tsx');
