export type ChapterId =
  | "boot"
  | "wasteland"
  | "relay"
  | "nexus"
  | "forge"
  | "identity";

export type SceneId =
  | "void"
  | "wasteland"
  | "relay"
  | "nexus"
  | "forge"
  | "identity";

export type Chapter = {
  id: ChapterId;
  sequence: string;
  scene: SceneId;
  systemLabel: string;
  titleEn: string;
  titleZh: string;
  description: string;
  quote?: string;
};

export const chapters: Chapter[] = [
  {
    id: "boot",
    sequence: "00",
    scene: "void",
    systemLabel: "ARCHIVE RESPONSE DETECTED",
    titleEn: "A signal returns from the silence.",
    titleZh: "寂静中，仍有信号返回。",
    description:
      "文明来源无法定位。一座被遗忘的个人档案节点，却仍在回应每一次读取请求。",
  },
  {
    id: "wasteland",
    sequence: "01",
    scene: "wasteland",
    systemLabel: "ORIGIN CIVILIZATION // UNREACHABLE",
    titleEn: "The world vanished. The record remained.",
    titleZh: "世界已经失联，记录仍在运行。",
    description:
      "风掠过半埋的道路。巨构没有回答它为何存在，远处的纪念碑轴只留下三层逐渐衰减的轮廓。",
    quote: "向前。找到仍在回应的节点。",
  },
  {
    id: "relay",
    sequence: "02",
    scene: "relay",
    systemLabel: "COMMUNICATION TRACE // RECOVERED",
    titleEn: "Some messages outlived their senders.",
    titleZh: "有些讯息，比发送它们的人存在得更久。",
    description:
      "中继终端完成了一次微弱握手。没有收件人，没有回执，只有一条曾经试图抵达他人的通信痕迹。",
  },
  {
    id: "nexus",
    sequence: "03",
    scene: "nexus",
    systemLabel: "RECORD STRUCTURE // DETECTED",
    titleEn: "A life appears as six incomplete echoes.",
    titleZh: "一个人，以六种不完整的回响显现。",
    description:
      "思想向风中迁徙，记忆在水下折射，创造在机械深处咬合。第六道环保持封存。",
  },
  {
    id: "forge",
    sequence: "04",
    scene: "forge",
    systemLabel: "CREATION RECORDS // FOUND",
    titleEn: "Created before the silence.",
    titleZh: "在寂静降临以前，他留下了造物。",
    description:
      "真实的项目从世界观外壳中显露。它们并非古物，而是仍在迭代、仍在被使用的创造记录。",
  },
  {
    id: "identity",
    sequence: "05",
    scene: "identity",
    systemLabel: "CLASSIFICATION ERROR",
    titleEn: "Source signal: active.",
    titleZh: "源信号仍在更新。",
    description:
      "系统曾把档案对象判定为历史遗存。最后一次校准后，头像、身份与记录时间第一次完全对齐。",
    quote: "THIS RECORD IS STILL BEING WRITTEN. / 这份记录仍在继续。",
  },
];

export type NexusBranchId = "memory" | "idea";

export type NexusBranch = {
  id: NexusBranchId;
  direction: "left" | "right";
  code: string;
  titleEn: string;
  titleZh: string;
  systemLabel: string;
  description: string;
  quote: string;
  image: string;
  records: string[];
};

export const nexusBranches: NexusBranch[] = [
  {
    id: "memory",
    direction: "left",
    code: "MEM-03",
    titleEn: "Human Memory Reservoir",
    titleZh: "人类记忆库",
    systemLabel: "MEMORY SOURCE // PARTIAL",
    description:
      "水面保存了无法完整复原的旅行、影像与人生片段。两枚远处的核心以相同频率闪烁，但公共系统拒绝继续靠近。",
    quote: "记忆保存那些拒绝消失的东西。",
    image: "/images/memory-reservoir.png",
    records: [
      "PERSONAL FOOTAGE / FRAGMENTED",
      "TRAVEL RECORD / RECOVERABLE",
      "DUAL CORE / ACCESS DENIED",
    ],
  },
  {
    id: "idea",
    direction: "right",
    code: "THO-02",
    titleEn: "The Migrating Thoughts",
    titleZh: "迁徙思想",
    systemLabel: "THOUGHT SOURCE // UNSTABLE",
    description:
      "风经过失效的花园，未完成的构思从石碑、落叶与白鸟之间迁徙。它们没有消失，只是拒绝停留在原处。",
    quote: "思想并不消失。它们只是迁徙。",
    image: "/images/migrating-thoughts.png",
    records: [
      "DESIGN NOTES / ACTIVE",
      "UNFINISHED PLANS / MIGRATING",
      "IDEA LINEAGE / PARTIAL",
    ],
  },
];

export type ArchiveNode = {
  id: "mail" | "idea" | "memory" | "works" | "about" | "love";
  code: string;
  title: string;
  english: string;
  summary: string;
  status: "online" | "partial" | "active" | "sealed";
  target: ChapterId;
  direction: "forward" | "west" | "east" | "hidden";
  visibility: "public" | "hidden";
  discoveredByDefault: boolean;
};

export const archiveNodes: ArchiveNode[] = [
  {
    id: "mail",
    code: "COM-01",
    title: "通讯中继站",
    english: "Communication Relay",
    summary: "通信、来信与仍在重试的连接。",
    status: "partial",
    target: "relay",
    direction: "forward",
    visibility: "public",
    discoveredByDefault: true,
  },
  {
    id: "idea",
    code: "THO-02",
    title: "迁徙思想",
    english: "Migrating Thoughts",
    summary: "随想、灵感与尚未完成的计划。",
    status: "online",
    target: "nexus",
    direction: "east",
    visibility: "public",
    discoveredByDefault: false,
  },
  {
    id: "memory",
    code: "MEM-03",
    title: "人类记忆库",
    english: "Memory Reservoir",
    summary: "影像、经历与拒绝消失的片段。",
    status: "partial",
    target: "nexus",
    direction: "west",
    visibility: "public",
    discoveredByDefault: false,
  },
  {
    id: "works",
    code: "ART-04",
    title: "遗物锻造场",
    english: "Artifact Forge",
    summary: "网站、软件、AI实验与持续迭代的作品。",
    status: "active",
    target: "forge",
    direction: "forward",
    visibility: "public",
    discoveredByDefault: false,
  },
  {
    id: "about",
    code: "IDN-05",
    title: "身份恢复",
    english: "Identity Recovery",
    summary: "关于档案对象、技能、兴趣与外部链路。",
    status: "active",
    target: "identity",
    direction: "forward",
    visibility: "public",
    discoveredByDefault: false,
  },
  {
    id: "love",
    code: "EMO-06",
    title: "封存庭园",
    english: "The Sealed Garden",
    summary: "一组从未进入公共索引的双生记忆。",
    status: "sealed",
    target: "nexus",
    direction: "hidden",
    visibility: "hidden",
    discoveredByDefault: false,
  },
];

export const artifactRecords = [
  {
    code: "ARTIFACT / 001",
    title: "Interface Systems",
    category: "WEB · INTERACTION",
    description: "把复杂系统整理成清晰、可用并具有情绪的界面。",
  },
  {
    code: "ARTIFACT / 002",
    title: "AI Experiments",
    category: "AI · PROTOTYPING",
    description: "围绕智能工具、生成体验与人机协作进行快速实验。",
  },
  {
    code: "ARTIFACT / 003",
    title: "Digital Archives",
    category: "STORY · SYSTEM",
    description: "让个人记忆、作品与长期记录拥有统一的叙事容器。",
  },
];
