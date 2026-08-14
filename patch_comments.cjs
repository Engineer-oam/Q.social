const fs = require('fs');
let code = fs.readFileSync('src/components/Comments.tsx', 'utf8');

code = code.replace(
  "import { doc, getDoc } from 'firebase/firestore';",
  ""
);

code = code.replace(
  "const [lastDoc, setLastDoc] = useState<any>(null);",
  "const [offset, setOffset] = useState<number>(0);"
);

code = code.replace(
  /const fetchComments = async \(isLoadMore = false\) => \{[\s\S]*?\}\s*catch \(err\) \{/m,
  `const fetchComments = async (isLoadMore = false) => {
    if (!hasMore && isLoadMore) return;
    
    try {
      const currentOffset = isLoadMore ? offset : 0;
      const { docs, nextOffset } = await getComments(postId, currentOffset, 20);
      
      const newComments: typeof comments = [];
      for (const data of docs) {
        let author: UserProfile | undefined;
        try {
          const { data: authorData } = await supabase.from('profiles').select('*').eq('id', data.userId).single();
          if (authorData) author = authorData as UserProfile;
        } catch (e) {}
        newComments.push({ ...data, author });
      }
      
      if (isLoadMore) {
        setComments(prev => [...prev, ...newComments]);
      } else {
        setComments(newComments);
      }
      
      setOffset(nextOffset);
      if (docs.length < 20) setHasMore(false);
      
    } catch (err) {`
);

fs.writeFileSync('src/components/Comments.tsx', code);
