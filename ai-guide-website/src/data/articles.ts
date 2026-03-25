// src/data/articles.ts

// 定义文章的数据格式
export interface ArticleMeta {
    id: string;        // 对应 markdown 文件的名字，比如 'hello-ai'
    title: string;     // 文章标题
    desc: string;      // 列表页显示的简短描述
    categoryId: string;// 归属哪个分类，比如 'basic', 'work', 'life'
    date: string;      // 发布日期
  }
  
  // 你的所有文章列表（以后写了新文章，就往这里加）
  export const articles: ArticleMeta[] = [
    {
      id: 'hello-ai',
      title: '第一课：如何让 AI 帮你写出爆款文案？',
      desc: '了解 AI 沟通的万能公式：身份 + 任务 + 具体要求。附赠小红书文案一键生成提示词。',
      categoryId: 'basic',
      date: '2023-10-24'
    },
    {
      id: 'weekly-report',
      title: '只需 3 步，让 AI 帮你把流水账变成高级“周报”',
      desc: '打工人必看！把每天碎碎念的工作记录，一键转化为老板最爱看的高管级汇报。',
      categoryId: 'work',
      date: '2023-10-25'
    },
    {
      id: 'travel-plan',
      title: '周末去哪玩？用 AI 生成一份像素级旅游攻略',
      desc: '只需告诉 AI 你的预算和天数，它连每天几点吃什么都帮你安排得明明白白。',
      categoryId: 'life',
      date: '2023-10-26'
    }
  ];