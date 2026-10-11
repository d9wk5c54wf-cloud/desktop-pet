/**
 * 基金涨跌监控插件
 *
 * 从腾讯行情 API 获取基金数据，
 * 多只基金时在气泡中按顺序轮流展示。
 */

// 获取单只基金实时估值
async function fetchFund(http, code) {
  const url = `https://qt.gtimg.cn/q=jj${code}`;
  console.log("[基金插件] 请求:", url);
  try {
    const raw = await http.get(url);
    console.log("[基金插件] 响应:", raw);

    // 解析格式: v_jj000001="1~华夏成长~000001~1.2345~0.0123~1.00~..."
    const match = raw.match(/="([^"]+)"/);
    if (!match) {
      console.warn("[基金插件] 无法解析响应格式");
      return null;
    }

    const fields = match[1].split("~");
    console.log("[基金插件] 字段数:", fields.length, "字段:", fields);

    // 腾讯接口字段: [0]=代码 [1]=名称 [5]=单位净值 [7]=日涨跌幅% [8]=日期
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

export default {
  async onLoad(context, config) {
    const { http, bubble } = context;

    // 从 manifest config 读取基金代码、刷新间隔和轮播间隔
    const codes = config?.funds ?? ["000001"];
    const interval = config?.refreshInterval ?? 60000;
    const rotateInterval = config?.rotateInterval ?? 5000;

    // 最新数据，保持与 codes 相同顺序
    let funds = [];
    let index = 0;

    // 展示当前下标的基金
    const renderCurrent = () => {
      if (funds.length === 0) return;
      const i = index % funds.length;
      bubble.show(buildBubbleText(funds[i], i, funds.length));
    };

    // 轮到下一只基金
    const rotate = () => {
      if (funds.length <= 1) return;
      index = (index + 1) % funds.length;
      renderCurrent();
    };

    const refresh = async () => {
      try {
        const results = await Promise.allSettled(
          codes.map((code) => fetchFund(http, code))
        );

        // 按 codes 顺序保留成功的数据
        funds = results
          .map((r) => (r.status === "fulfilled" ? r.value : null))
          .filter(Boolean);

        if (funds.length > 0) {
          renderCurrent();
        } else {
          bubble.show("获取基金数据失败");
        }
      } catch (err) {
        console.error("基金插件刷新失败:", err);
        bubble.show("基金数据加载异常");
      }
    };

    // 首次加载
    await refresh();

    // 定时刷新数据
    setInterval(refresh, interval);

    // 多只基金时定时轮流显示
    if (codes.length > 1) {
      setInterval(rotate, rotateInterval);
    }

    // 返回 onTap 钩子，点按时触发
    return {
      async onTap() {
        console.log("[基金插件] 点按触发，刷新数据");
        await refresh();
      },
    };
  },
};
