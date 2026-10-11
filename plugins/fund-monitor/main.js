/**
 * 基金涨跌监控插件
 *
 * 从腾讯行情 API 获取基金数据，
 * 点按时显示当前基金并切到下一只。
 */

// 获取单只基金实时估值
async function fetchFund(http, code) {
  const url = `https://qt.gtimg.cn/q=jj${code}`;
  console.log("[基金插件] 请求:", url);
  try {
    const raw = await http.get(url);
    console.log("[基金插件] 响应:", raw);

    const match = raw.match(/="([^"]+)"/);
    if (!match) {
      console.warn("[基金插件] 无法解析响应格式");
      return null;
    }

    const fields = match[1].split("~");
    console.log("[基金插件] 字段数:", fields.length, "字段:", fields);

    if (fields.length < 8) {
      console.warn("[基金插件] 字段数不足:", fields.length);
      return null;
    }

    return {
      fundcode: code,
      name: fields[1] || code,
      dwjz: fields[5] || "0",
      gszzl: fields[7] || "0",
      date: fields[8] || "",
    };
  } catch (e) {
    console.error("[基金插件] 请求失败:", code, e);
    return null;
  }
}

// 格式化涨跌幅，带颜色（A股惯例：红涨绿跌）
function formatChange(changeStr) {
  const val = parseFloat(changeStr);
  if (isNaN(val)) return '<span style="color:#999">--</span>';
  const sign = val >= 0 ? "+" : "";
  const color = val > 0 ? "#e74c3c" : val < 0 ? "#27ae60" : "#999";
  return `<span style="color:${color};font-weight:700">${sign}${val.toFixed(2)}%</span>`;
}

// 构建气泡 HTML（单只基金，多只时附带序号）
function buildBubbleText(fund, index, total) {
  const change = formatChange(fund.gszzl);
  const pos =
    total > 1
      ? `<div style="color:#bbb;font-size:10px;text-align:right">${index + 1}/${total}</div>`
      : "";
  return `<div>${fund.name}<br/>${change}</div>${pos}`;
}

// 模块级变量，跨 onLoad 调用保持轮换状态
let index = 0;

export default {
  async onLoad(context, config) {
    const { http, bubble } = context;

    const codes = config?.funds ?? ["000001"];
    const interval = config?.refreshInterval ?? 60000;

    // 最新数据，保持与 codes 相同顺序
    let funds = [];

    // 拉取所有基金数据
    const refresh = async () => {
      try {
        const results = await Promise.allSettled(
          codes.map((code) => fetchFund(http, code))
        );
        funds = results
          .map((r) => (r.status === "fulfilled" ? r.value : null))
          .filter(Boolean);
      } catch (err) {
        console.error("基金插件刷新失败:", err);
      }
    };

    // 首次加载：拉取数据并显示当前基金
    await refresh();

    if (funds.length > 0) {
      const i = index % funds.length;
      bubble.show(buildBubbleText(funds[i], i, funds.length));
      index = (index + 1) % funds.length;
    }

    // 定时静默刷新数据
    setInterval(refresh, interval);

    // 点按时：显示当前基金，然后切到下一只
    return {
      async onTap() {
        console.log("[基金插件] 点按触发");
        // 先刷新数据再显示，确保是最新的
        await refresh();

        if (funds.length === 0) {
          bubble.show("获取基金数据失败");
          return;
        }

        const i = index % funds.length;
        bubble.show(buildBubbleText(funds[i], i, funds.length));
        // 切到下一只，下次点击显示下一只
        index = (index + 1) % funds.length;
      },
    };
  },
};