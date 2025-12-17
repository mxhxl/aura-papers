export interface Paper {
  title: string;
  author: string;
  date: string;
}

export const mockPapers: Paper[] = [
  { title: 'AI Ethics', author: 'Jane Doe', date: '2023-01-15' },
  { title: 'Machine Learning in Healthcare', author: 'John Smith', date: '2023-03-22' },
  { title: 'Quantum Computing Basics', author: 'Alice Johnson', date: '2022-11-08' },
  { title: 'Natural Language Processing', author: 'Bob Williams', date: '2023-06-30' },
  { title: 'Deep Learning Architectures', author: 'Jane Doe', date: '2022-09-14' },
  { title: 'Blockchain Technology', author: 'Charlie Brown', date: '2023-02-28' },
  { title: 'Computer Vision Applications', author: 'Diana Ross', date: '2023-05-17' },
  { title: 'Reinforcement Learning', author: 'Edward Chen', date: '2022-12-03' },
];

export interface SearchResult {
  found: boolean;
  paper?: Paper;
}

export const checkPaperExistence = async (
  title: string,
  author: string
): Promise<SearchResult> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const normalizedTitle = title.toLowerCase().trim();
  const normalizedAuthor = author.toLowerCase().trim();

  const foundPaper = mockPapers.find(
    paper =>
      paper.title.toLowerCase() === normalizedTitle &&
      paper.author.toLowerCase() === normalizedAuthor
  );

  if (foundPaper) {
    return { found: true, paper: foundPaper };
  }

  return { found: false };
};
