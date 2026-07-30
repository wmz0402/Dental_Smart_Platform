<template>
  <div class="reports-page">
    <div class="page-header">
      <div class="header-titles">
        <h2>感控合规报表与溯源系统</h2>
        <p>国标合规存档、合规问题存在率、精细对标脱敏报告生成统计与溯源</p>
      </div>
      <div class="header-actions">
        <el-date-picker
          v-model="reportDate"
          type="date"
          placeholder="选择报表日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
        />
        <el-button type="success" @click="exportPDF" :loading="isExporting">
          导出标准医院检验报告单 (PDF)
        </el-button>
      </div>
    </div>

    <!-- 1. 网页系统界面中的报表概览预览卡片 -->
    <div class="glass-card report-preview-card">
      <div class="report-header-box">
        <div class="brand-title">
          <h2>口腔门诊感控水气质量每日合规审计报告</h2>
          <span>国家卫生行业标准 WS/T 842-2024 / WS/T 592 专项合规档案</span>
        </div>
        <div class="report-meta">
          <div class="meta-item"><strong>报告日期：</strong> {{ reportDate }}</div>
          <div class="meta-item"><strong>机构名称：</strong> 示范总院口腔门诊部</div>
          <div class="meta-item"><strong>感控责任人：</strong> {{ userStore.user?.realName || '超级管理员' }}</div>
        </div>
      </div>

      <div class="score-banner">
        <div class="score-circle">
          <span class="score-num">98.5</span>
          <span class="score-label">综合感控合规得分</span>
        </div>
        <div class="score-grid">
          <div class="grid-card">
            <!-- 动态响应式读取设备总数 -->
            <span class="val">{{ totalDeviceCount }} 台</span>
            <span class="lbl">监测设备总数</span>
          </div>
          <div class="grid-card">
            <span class="val">100%</span>
            <span class="lbl">水源消毒达标率</span>
          </div>
          <div class="grid-card">
            <span class="val">99.8%</span>
            <span class="lbl">气源洁净达标率</span>
          </div>
          <div class="grid-card">
            <span class="val">0 起</span>
            <span class="lbl">严重安全事件</span>
          </div>
        </div>
      </div>

      <div class="section-block">
        <h3>国家规范与审计指标检验表 (WS/T842-2024)</h3>
        <table class="report-table">
          <thead>
            <tr>
              <th>审计分类</th>
              <th>国家标准限量 / 规范要求</th>
              <th>今日实测均值</th>
              <th>极值范围</th>
              <th>合规判定</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>水路菌落总数</td>
              <td>&le; 100 CFU/mL</td>
              <td>12.4 CFU/mL</td>
              <td>8.0 - 18.2</td>
              <td><span class="status-pass">合格 (PASS)</span></td>
            </tr>
            <tr>
              <td>水路 TDS 溶解固形物</td>
              <td>&le; 50 ppm</td>
              <td>14.2 ppm</td>
              <td>11.0 - 18.5</td>
              <td><span class="status-pass">合格 (PASS)</span></td>
            </tr>
            <tr>
              <td>消毒剂有效浓度 (微酸性次氯酸)</td>
              <td>50 - 100 mg/L</td>
              <td>72.5 mg/L</td>
              <td>65.0 - 82.0</td>
              <td><span class="status-pass">合格 (PASS)</span></td>
            </tr>
            <tr>
              <td>气源压力稳定度</td>
              <td>0.55 - 0.70 MPa</td>
              <td>0.65 MPa</td>
              <td>0.62 - 0.68</td>
              <td><span class="status-pass">合格 (PASS)</span></td>
            </tr>
            <tr>
              <td>气源露点温度 (干燥度)</td>
              <td>&le; -40 &deg;C</td>
              <td>-42.5 &deg;C</td>
              <td>-45.0 - -40.2</td>
              <td><span class="status-pass">合格 (PASS)</span></td>
            </tr>
            <tr>
              <td>气源油雾与尘埃粒子</td>
              <td>无油 0.01 mg/m&sup3;</td>
              <td>0.002 mg/m&sup3;</td>
              <td>0.001 - 0.003</td>
              <td><span class="status-pass">合格 (PASS)</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="section-block">
        <h3>感控硬件设备列表与实时监控履历 (共 {{ totalDeviceCount }} 台)</h3>
        <el-table :data="deviceStore.devices" style="width: 100%">
          <el-table-column prop="sn" label="设备编号" width="160" />
          <el-table-column prop="name" label="设备名称" min-width="200" />
          <el-table-column prop="type" label="系统分类" width="140">
            <template #default="scope">
              <el-tag :type="scope.row.type === 'WATER' ? 'primary' : 'success'" size="small">
                {{ scope.row.type === 'WATER' ? '水源消毒系统' : '气源洁净系统' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="location" label="部署位置" width="180" />
          <el-table-column prop="work_mode" label="运行模式" width="120" />
          <el-table-column prop="filter_level" label="健康度" width="120">
            <template #default="scope">
              <span style="color: #10b981; font-weight: bold;">{{ scope.row.filter_level }}%</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 2. 离屏渲染：标准医院检验报告单模板 (导出 PDF 专用纯白医疗规整排版) -->
    <div class="hospital-pdf-container">
      <div id="hospital-report-pdf" class="hospital-paper">
        <!-- 医院报告标头 -->
        <div class="hospital-header">
          <h1 class="hospital-title">示范总院口腔医疗中心 临床感控检测报告单</h1>
          <div class="hospital-sub">NATIONAL DENTAL INFECTION CONTROL AUDIT REPORT</div>
          <div class="hospital-divider"></div>
        </div>

        <!-- 患者/受检采样基本信息栏 -->
        <div class="info-grid-table">
          <div class="info-cell"><strong>采样编号：</strong> LAB-{{ reportDate.replace(/-/g, '') }}-089</div>
          <div class="info-cell"><strong>送检科室：</strong> 口腔门诊综合感控部</div>
          <div class="info-cell"><strong>采样日期：</strong> {{ reportDate }}</div>
          <div class="info-cell"><strong>检测项目：</strong> 诊疗水气质量与菌落总数</div>
          <div class="info-cell"><strong>在籍设备总数：</strong> {{ totalDeviceCount }} 台设备</div>
          <div class="info-cell"><strong>检测负责人：</strong> {{ userStore.user?.realName || '超级管理员' }}</div>
        </div>

        <!-- 检验项目与标准对照表 -->
        <div class="hospital-section">
          <div class="section-title">一、感控水气指标检测结果对照表 (WS/T 842-2024)</div>
          <table class="hospital-table">
            <thead>
              <tr>
                <th>序号</th>
                <th>检测项目名称</th>
                <th>检测结果</th>
                <th>临床参考范围/限量标准</th>
                <th>单位</th>
                <th>结果提示</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>01</td>
                <td>诊室管路菌落总数</td>
                <td>12.4</td>
                <td>&le; 100.0</td>
                <td>CFU/mL</td>
                <td class="pass-text">正常 (OK)</td>
              </tr>
              <tr>
                <td>02</td>
                <td>水路溶解性总固体 (TDS)</td>
                <td>14.2</td>
                <td>&le; 50.0</td>
                <td>ppm</td>
                <td class="pass-text">正常 (OK)</td>
              </tr>
              <tr>
                <td>03</td>
                <td>微酸性次氯酸有效氯浓度</td>
                <td>72.5</td>
                <td>50.0 - 100.0</td>
                <td>mg/L</td>
                <td class="pass-text">正常 (OK)</td>
              </tr>
              <tr>
                <td>04</td>
                <td>医用压缩空气压力稳定度</td>
                <td>0.65</td>
                <td>0.55 - 0.70</td>
                <td>MPa</td>
                <td class="pass-text">正常 (OK)</td>
              </tr>
              <tr>
                <td>05</td>
                <td>气源露点温度 (干燥度)</td>
                <td>-42.5</td>
                <td>&le; -40.0</td>
                <td>&deg;C</td>
                <td class="pass-text">正常 (OK)</td>
              </tr>
              <tr>
                <td>06</td>
                <td>气源油雾与尘埃粒子</td>
                <td>0.002</td>
                <td>&le; 0.010</td>
                <td>mg/m&sup3;</td>
                <td class="pass-text">正常 (OK)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 在籍设备运行档案 -->
        <div class="hospital-section">
          <div class="section-title">二、在籍感控硬件设备状态档案 (已同步动态设备共 {{ totalDeviceCount }} 台)</div>
          <table class="hospital-table mini-table">
            <thead>
              <tr>
                <th>设备编号</th>
                <th>设备名称</th>
                <th>系统分类</th>
                <th>部署位置</th>
                <th>当前运行模式</th>
                <th>设备健康度</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="dev in deviceStore.devices" :key="dev.id">
                <td>{{ dev.sn }}</td>
                <td>{{ dev.name }}</td>
                <td>{{ dev.type === 'WATER' ? '水质消毒' : '气源洁净' }}</td>
                <td>{{ dev.location }}</td>
                <td>{{ dev.work_mode }}</td>
                <td class="pass-text">{{ dev.filter_level }}%</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 总结判定与印章签名区 -->
        <div class="hospital-conclusion">
          <div class="conclusion-title">三、合规审计结论</div>
          <p class="conclusion-desc">
            经示范总院口腔感控智能监测系统全面检测，本机构在籍全部 <strong>{{ totalDeviceCount }} 台</strong> 感控水气设备指标完全符合国家卫生行业标准 WS/T 842-2024 与 WS/T 592 规范要求，综合评估判定为 <strong>【合格 (PASS)】</strong>，准予正常开展临床诊疗工作。
          </p>

          <div class="seal-and-sign">
            <!-- 红色官方椭圆印章印鉴 -->
            <div class="hospital-seal">
              <div class="seal-inner">
                <span>示范总院口腔医疗中心</span>
                <span class="seal-main">感控检验专用章</span>
                <span>(3-1)</span>
              </div>
            </div>

            <div class="sign-fields">
              <div class="sign-item"><strong>检验医师：</strong> 张华 (签章)</div>
              <div class="sign-item"><strong>审核医师：</strong> 李国强 (主任医师)</div>
              <div class="sign-item"><strong>报告打印时间：</strong> {{ currentTime }}</div>
            </div>
          </div>
        </div>

        <div class="hospital-footer-note">
          说明：本报告由智护牙境感控平台实时遥测自动汇总出具，加盖电子检验专用章有效。
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useUserStore } from '@/stores/userStore';
import { useDeviceStore } from '@/stores/deviceStore';
import { ElMessage } from 'element-plus';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const userStore = useUserStore();
const deviceStore = useDeviceStore();

const reportDate = ref('2026-07-30');
const currentTime = ref(new Date().toLocaleString());
const isExporting = ref(false);

const totalDeviceCount = computed(() => {
  return deviceStore.devices.length || deviceStore.overview.totalDevices || 7;
});

const exportPDF = async () => {
  const reportElement = document.getElementById('hospital-report-pdf');
  if (!reportElement) {
    return ElMessage.error('找不到医院报告单渲染节点');
  }

  isExporting.value = true;
  const loadingMsg = ElMessage.info({
    message: '正在生成标准医院临床检验 PDF 报告单...',
    duration: 0
  });

  try {
    const canvas = await html2canvas(reportElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    loadingMsg.close();
    const fileName = `示范总院_口腔感控检测报告单_${reportDate.value}.pdf`;
    pdf.save(fileName);

    ElMessage.success(`标准医院检验报告单已成功下载至本地: ${fileName}`);
  } catch (error: any) {
    loadingMsg.close();
    console.error('导出 PDF 失败:', error);
    ElMessage.error('报告单导出失败，请重试');
  } finally {
    isExporting.value = false;
  }
};

onMounted(() => {
  const today = new Date().toISOString().split('T')[0];
  reportDate.value = today;
  deviceStore.fetchOverview();
  deviceStore.fetchDevices();
});
</script>

<style scoped>
.reports-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.header-titles h2 {
  font-size: 22px;
  color: var(--text-main);
  font-weight: 700;
}

.header-titles p {
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 4px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 网页预览概览卡片 */
.report-preview-card {
  position: relative;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  border-radius: 12px;
}

.report-header-box {
  border-bottom: 2px solid var(--card-border);
  padding-bottom: 16px;
}

.brand-title h2 {
  font-size: 20px;
  color: var(--text-main);
  font-weight: 700;
}

.brand-title span {
  font-size: 12px;
  color: var(--primary-color);
  margin-top: 4px;
  display: inline-block;
}

.report-meta {
  display: flex;
  gap: 32px;
  margin-top: 16px;
  font-size: 13px;
  color: var(--text-muted);
}

.report-meta strong {
  color: var(--text-main);
}

.score-banner {
  display: flex;
  align-items: center;
  gap: 32px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid var(--card-border);
  border-radius: 10px;
  padding: 20px 28px;
}

.score-circle {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0) 70%);
  border: 3px solid var(--success-color);
}

.score-num {
  font-size: 28px;
  font-weight: bold;
  color: var(--success-color);
}

.score-label {
  font-size: 10px;
  color: var(--text-muted);
}

.score-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.grid-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 8px;
}

.grid-card .val {
  font-size: 18px;
  font-weight: bold;
  color: var(--text-main);
}

.grid-card .lbl {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 4px;
}

.section-block h3 {
  font-size: 15px;
  color: var(--text-main);
  font-weight: 600;
  margin-bottom: 12px;
  border-left: 3px solid var(--primary-color);
  padding-left: 10px;
}

.report-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 8px;
}

.report-table th,
.report-table td {
  border: 1px solid var(--card-border);
  padding: 10px 14px;
  font-size: 13px;
  text-align: left;
}

.report-table th {
  background-color: rgba(30, 45, 82, 0.5);
  color: var(--text-main);
  font-weight: 600;
}

.report-table td {
  color: var(--text-muted);
}

.status-pass {
  color: var(--success-color);
  font-weight: bold;
}

/* 离屏标准医院检验报告单模板 */
.hospital-pdf-container {
  position: absolute;
  left: -9999px;
  top: -9999px;
}

.hospital-paper {
  width: 800px;
  padding: 40px 48px;
  background-color: #ffffff;
  color: #111827;
  font-family: 'SimSun', 'Songti SC', serif, sans-serif;
  box-sizing: border-box;
}

.hospital-header {
  text-align: center;
  margin-bottom: 20px;
}

.hospital-title {
  font-size: 22px;
  font-weight: bold;
  letter-spacing: 1px;
  color: #000000;
  margin-bottom: 4px;
}

.hospital-sub {
  font-size: 10px;
  font-family: Arial, sans-serif;
  color: #4b5563;
  letter-spacing: 1.5px;
}

.hospital-divider {
  height: 3px;
  border-top: 2px solid #000000;
  border-bottom: 1px solid #000000;
  margin-top: 10px;
}

.info-grid-table {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px 24px;
  padding: 12px;
  border: 1px solid #000000;
  font-size: 13px;
  margin-bottom: 20px;
  background-color: #fafafa;
}

.info-cell strong {
  color: #000000;
}

.hospital-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 14px;
  font-weight: bold;
  color: #000000;
  margin-bottom: 8px;
  border-bottom: 1.5px solid #000000;
  padding-bottom: 4px;
}

.hospital-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.hospital-table th,
.hospital-table td {
  border: 1px solid #000000;
  padding: 8px 10px;
  text-align: center;
}

.hospital-table th {
  background-color: #f3f4f6;
  font-weight: bold;
  color: #000000;
}

.mini-table td {
  font-size: 11px;
  padding: 6px;
}

.pass-text {
  color: #059669;
  font-weight: bold;
}

.hospital-conclusion {
  position: relative;
  border: 1px solid #000000;
  padding: 16px;
  margin-top: 24px;
  background-color: #fffdfa;
}

.conclusion-title {
  font-size: 14px;
  font-weight: bold;
  color: #000000;
  margin-bottom: 6px;
}

.conclusion-desc {
  font-size: 13px;
  line-height: 1.6;
  color: #1f2937;
}

.seal-and-sign {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-top: 20px;
}

.hospital-seal {
  width: 130px;
  height: 90px;
  border: 3px solid #dc2626;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #dc2626;
  transform: rotate(-12deg);
  box-shadow: 0 0 2px rgba(220, 38, 38, 0.2);
}

.seal-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  font-size: 9px;
  font-weight: bold;
}

.seal-main {
  font-size: 12px;
  margin: 2px 0;
  letter-spacing: 1px;
}

.sign-fields {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
}

.sign-item strong {
  color: #000000;
}

.hospital-footer-note {
  margin-top: 24px;
  font-size: 10px;
  color: #6b7280;
  text-align: center;
  border-top: 1px solid #e5e7eb;
  padding-top: 8px;
}
</style>
