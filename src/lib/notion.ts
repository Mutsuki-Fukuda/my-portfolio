import { Client } from "@notionhq/client";
// エラーを防ぐため「node:」を明記
import fs from "node:fs";
import path from "node:path";
import { Buffer } from "node:buffer";
import process from "node:process";

const notion = new Client({
  auth: import.meta.env.NOTION_TOKEN as string,
});

// 画像をローカルにダウンロードして保存する関数
const saveImageLocally = async (url: string, blockId: string) => {
  try {
    const outDir = path.join(process.cwd(), 'public', 'notion-images');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    
    const cleanUrl = url.split('?')[0];
    const ext = cleanUrl.split('.').pop() || 'png';
    const fileName = `${blockId}.${ext}`;
    const filePath = path.join(outDir, fileName);

    if (fs.existsSync(filePath)) {
      return `/notion-images/${fileName}`;
    }

    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(filePath, buffer);

    return `/notion-images/${fileName}`;
  } catch (error) {
    console.error("画像保存エラー:", error);
    return url;
  }
};

const fetchAllBlocks = async (blockId: string): Promise<any[]> => {
  let blocks: any[] = [];
  let cursor: string | undefined = undefined;

  do {
    const response = await notion.blocks.children.list({
      block_id: blockId,
      start_cursor: cursor,
    });
    blocks = blocks.concat(response.results);
    cursor = response.next_cursor ?? undefined;
  } while (cursor);

  const expandedBlocks = await Promise.all(
    blocks.map(async (block: any) => {
      if (block.has_children) {
        block.children = await fetchAllBlocks(block.id);
      }

      if (block.type === 'image' && block.image.type === 'file') {
        const localUrl = await saveImageLocally(block.image.file.url, block.id);
        block.image.file.url = localUrl;
      }
      return block;
    })
  );

  return expandedBlocks;
};

export const getNotionData = async () => {
  return await fetchAllBlocks(import.meta.env.NOTION_PAGE_ID as string);
};