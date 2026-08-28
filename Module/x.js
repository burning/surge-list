/**
 * X (Twitter) 去广告与时间线推荐过滤脚本
 */
const url = $request.url;
let body = $response.body;

if (body) {
  try {
    let obj = JSON.parse(body);

    // 过滤 GraphQL / Timeline 响应中的广告推文
    const filterInstructions = (instructions) => {
      if (!Array.isArray(instructions)) return;
      instructions.forEach((instruction) => {
        // 1. 处理 AddEntries 类型的流
        if (instruction.type === "TimelineAddEntries" && Array.isArray(instruction.entries)) {
          instruction.entries = instruction.entries.filter((entry) => {
            const entryId = entry.entryId || "";
            // 过滤广告推文条目、推荐关注、轮播横幅等
            if (
              entryId.includes("promoted") ||
              entryId.includes("promoted-tweet") ||
              entryId.includes("who-to-follow") ||
              entryId.includes("WhoToFollow") ||
              entryId.includes("trend")
            ) {
              return false;
            }
            // 检查内容内部是否带有推广元数据
            const itemContent = entry.content?.itemContent;
            if (itemContent?.promotedMetadata || itemContent?.promotedContent) {
              return false;
            }
            return true;
          });
        }
        // 2. 处理 PinEntry 类型
        if (instruction.type === "TimelinePinEntry") {
          const itemContent = instruction.entry?.content?.itemContent;
          if (itemContent?.promotedMetadata || itemContent?.promotedContent) {
            delete instruction.entry;
          }
        }
      });
    };

    // 匹配常规 GraphQL 返回结构
    if (obj.data?.home?.home_timeline_urt?.instructions) {
      filterInstructions(obj.data.home.home_timeline_urt.instructions);
    } else if (obj.data?.user?.result?.timeline_v2?.timeline?.instructions) {
      filterInstructions(obj.data.user.result.timeline_v2.timeline.instructions);
    } else if (obj.data?.threaded_conversation_with_injections_v2?.instructions) {
      filterInstructions(obj.data.threaded_conversation_with_injections_v2.instructions);
    }

    body = JSON.stringify(obj);
  } catch (e) {
    // 解析失败直接放行，避免破坏客户端请求
  }
}

$done({ body });
