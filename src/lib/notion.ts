import { Client } from "@notionhq/client";

const notion = new Client({
  auth: import.meta.env.NOTION_TOKEN as string,
});

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
      return block;
    })
  );

  return expandedBlocks;
};

export const getNotionData = async () => {
  return await fetchAllBlocks(import.meta.env.NOTION_PAGE_ID as string);
};