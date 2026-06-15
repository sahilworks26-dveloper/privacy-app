import {Share} from 'react-native';
import type {ComplianceReport, ScanResult} from '../types/app';
import {getDeviceId} from './EnrollmentService';
import {getEnrollmentStatus} from './EnrollmentService';
import {getStoredPolicy} from './PolicyService';
import {InstalledAppsNative, isNativeModuleAvailable} from './NativeBridge';

function buildReportText(report: ComplianceReport): string {
  const lines = [
    'AppGuard Compliance Report',
    '==========================',
    `Generated: ${report.generatedAt}`,
    `Device ID: ${report.deviceId}`,
    '',
    'Summary',
    `  Total user apps: ${report.summary.totalUserApps}`,
    `  Compliant: ${report.summary.compliant}`,
    `  Unauthorized: ${report.summary.unauthorized}`,
    '',
  ];

  if (report.enrollment?.enrolled) {
    lines.push(
      'Enrollment',
      `  Organization: ${report.enrollment.organizationName ?? 'N/A'}`,
      `  Enrolled at: ${report.enrollment.enrolledAt ?? 'N/A'}`,
      '',
    );
  }

  if (report.policy) {
    lines.push(
      'Policy',
      `  Version: ${report.policy.version}`,
      `  Allowed installers: ${report.policy.allowedInstallers.join(', ')}`,
      '',
    );
  }

  lines.push('Apps');
  for (const app of report.apps) {
    if (app.isSystemApp) {
      continue;
    }
    lines.push(
      `  - ${app.appName} (${app.packageName})`,
      `    Installer: ${app.installer}`,
      `    Status: ${app.isAuthorized ? 'AUTHORIZED' : 'UNAUTHORIZED'}`,
    );
  }

  return lines.join('\n');
}

export async function buildComplianceReport(
  scanResult: ScanResult,
): Promise<ComplianceReport> {
  const [deviceId, enrollment, policy] = await Promise.all([
    getDeviceId(),
    getEnrollmentStatus(),
    getStoredPolicy(),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    deviceId,
    enrollment: enrollment.enrolled ? enrollment : undefined,
    policy,
    summary: {
      totalUserApps: scanResult.totalScanned,
      compliant: scanResult.compliantCount,
      unauthorized: scanResult.unauthorized.length,
    },
    apps: scanResult.apps.map(app => ({
      appName: app.appName,
      packageName: app.packageName,
      installer: app.installerPackage || 'unknown',
      isSystemApp: app.isSystemApp,
      isAuthorized: app.isAuthorized,
    })),
  };
}

export async function exportJsonReport(scanResult: ScanResult): Promise<void> {
  const report = await buildComplianceReport(scanResult);
  await Share.share({
    message: JSON.stringify(report, null, 2),
    title: 'AppGuard Compliance Report (JSON)',
  });
}

export async function exportTextReport(scanResult: ScanResult): Promise<void> {
  const report = await buildComplianceReport(scanResult);
  await Share.share({
    message: buildReportText(report),
    title: 'AppGuard Compliance Report (Text)',
  });
}

export async function exportPdfReport(scanResult: ScanResult): Promise<void> {
  if (!isNativeModuleAvailable() || !InstalledAppsNative) {
    throw new Error('PDF export is only available on Android');
  }

  const report = await buildComplianceReport(scanResult);
  const text = buildReportText(report);
  const {contentUri} = await InstalledAppsNative.exportReportPdf(text);
  await InstalledAppsNative.shareFile(contentUri, 'application/pdf');
}
