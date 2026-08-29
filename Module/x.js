/**
 * X (Twitter) PWA & Web & App 通用去广告脚本
 */
const url = $request.url;
let body = $response.body;

if (body) {
  try {
    let obj = JSON.parse(body);

    const isPromoted = (entry) => {
      if (!entry) return false;
      const entryId = entry.entryId || "";
      // 常见广告 / 推广关键词过滤
      if (
        entryId.includes("promoted") ||
        entryId.includes("promoted-tweet") ||
        entryId.includes("who-to-follow") ||
        entryId.includes("WhoToFollow") ||
        entryId.includes("trend") ||
        entryId.includes("Topics") ||
        entryId.includes("topics")
      ) {
        return true;
      }

      // 提取核心推文元数据
      const itemContent = entry.content?.itemContent;
      const tweetResult =
        itemContent?.tweet_results?.result ||
        itemContent?.tweetDisplayType;

      if (
        itemContent?.promotedMetadata ||
        itemContent?.promotedContent ||
        tweetResult?.promotedMetadata ||
        tweetResult?.tweet?.promotedMetadata
      ) {
        return true;
      }
      return false;
    };

    const cleanInstructions = (instructions) => {
      if (!Array.isArray(instructions)) return;
      for (let i = instructions.length - 1; i >= 0; i--) {
        const inst = instructions[i];
        
        // 1. 处理主信息流 entries
        if (inst.type === "TimelineAddEntries" && Array.isArray(inst.entries)) {
          inst.entries = inst.entries.filter((entry) => !isPromoted(entry));
        }
        
        // 2. 处理 Pin 置顶与单个注入
        if (inst.type === "TimelinePinEntry") {
          if (isPromoted(inst.entry)) {
            instructions.splice(i, 1);
          }
        }
      }
    };

    // 网页端 / PWA 主时间线、关注流与搜索流路径
    if (obj.data) {
      if (obj.data.home?.home_timeline_urt?.instructions) {
        cleanInstructions(obj.data.home.home_timeline_urt.instructions);
      }
      if (obj.data.user?.result?.timeline_v2?.timeline?.instructions) {
        cleanInstructions(obj.data.user.result.timeline_v2.timeline.instructions);
      }
      if (obj.data.bookmark_timeline_v2?.timeline?.instructions) {
        cleanInstructions(obj.data.bookmark_timeline_v2.timeline.instructions);
      }
      if (obj.data.search_by_raw_query?.search_timeline?.timeline?.instructions) {
        cleanInstructions(obj.data.search_by_raw_query.search_timeline.timeline.instructions);
      }
      if (obj.data.threaded_conversation_with_injections_v2?.instructions) {
        cleanInstructions(obj.data.threaded_conversation_with_injections_v2.instructions);
      }
    }

    body = JSON.stringify(obj);
  } catch (e) {
    // 忽略非标准 JSON，原样放行
  }
}

$done({ body });
