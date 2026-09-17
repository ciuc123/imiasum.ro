import y2016 from './2016.json';
import y2017 from './2017.json';
import y2018 from './2018.json';
import y2019 from './2019.json';
import y2020 from './2020.json';
import y2021 from './2021.json';
import y2022 from './2022.json';
import y2023 from './2023.json';
import y2024 from './2024.json';

const importedPosts = [
  ...y2016,
  ...y2017,
  ...y2018,
  ...y2019,
  ...y2020,
  ...y2021,
  ...y2022,
  ...y2023,
  ...y2024,
].sort((a, b) => new Date(b.date) - new Date(a.date));

const removedPostIds = new Set([4589, 4601, 4618, 4650, 4668, 4682]);

export const posts = importedPosts.filter((post) => !removedPostIds.has(post.id));
