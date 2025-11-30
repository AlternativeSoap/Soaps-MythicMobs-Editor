/**
 * ImportReportGenerator.js
 * Generate diagnostic reports for import process
 */
class ImportReportGenerator {
    constructor() {
        this.reportData = null;
    }

    /**
     * Generate pre-import analysis report
     */
    generatePreImportReport(scanResults, parseResults, validationResults) {
        const report = {
            type: 'pre-import',
            generatedAt: new Date().toISOString(),
            summary: this.generateSummary(scanResults, parseResults, validationResults),
            packs: this.generatePackDetails(scanResults, parseResults, validationResults),
            issues: this.gatherAllIssues(parseResults, validationResults),
            crossReferences: this.gatherCrossReferences(validationResults)
        };

        this.reportData = report;
        return report;
    }

    /**
     * Generate post-import report
     */
    generatePostImportReport(importResults) {
        const report = {
            type: 'post-import',
            generatedAt: new Date().toISOString(),
            summary: {
                success: importResults.success,
                duration: `${(importResults.duration / 1000).toFixed(2)}s`,
                totalImported: importResults.totalImported,
                totalSkipped: importResults.totalSkipped,
                totalFailed: importResults.totalFailed,
                placeholdersCreated: importResults.placeholdersCreated.length
            },
            packs: importResults.packs.map(p => ({
                name: p.packName,
                imported: p.imported,
                skipped: p.skipped,
                failed: p.failed,
                entries: p.entries,
                errors: p.errors
            })),
            placeholders: importResults.placeholdersCreated,
            errors: importResults.errors
        };

        return report;
    }

    /**
     * Generate summary statistics
     */
    generateSummary(scanResults, parseResults, validationResults) {
        const summary = {
            totalPacks: scanResults.packs.length,
            totalFiles: scanResults.summary.totalFiles,
            totalSize: scanResults.summary.totalSizeFormatted,
            folderType: scanResults.type,
            statistics: {
                mobs: { total: 0, valid: 0, warnings: 0, errors: 0 },
                skills: { total: 0, valid: 0, warnings: 0, errors: 0 },
                items: { total: 0, valid: 0, warnings: 0, errors: 0 },
                droptables: { total: 0, valid: 0, warnings: 0, errors: 0 },
                randomspawns: { total: 0, valid: 0, warnings: 0, errors: 0 }
            },
            issuesCounts: {
                critical: 0,
                warning: 0,
                info: 0
            }
        };

        // Aggregate stats from all packs
        for (const [packName, validation] of validationResults) {
            if (!validation) continue;

            for (const fileResult of validation.validationResults) {
                const type = this.mapFolderToType(fileResult.folderType);
                if (!summary.statistics[type]) continue;

                for (const entry of fileResult.entries) {
                    summary.statistics[type].total++;
                    
                    const hasCritical = entry.issues.some(i => i.severity === 'critical');
                    const hasWarning = entry.issues.some(i => i.severity === 'warning');

                    if (hasCritical) {
                        summary.statistics[type].errors++;
                    } else if (hasWarning) {
                        summary.statistics[type].warnings++;
                    } else {
                        summary.statistics[type].valid++;
                    }

                    for (const issue of entry.issues) {
                        summary.issuesCounts[issue.severity] = 
                            (summary.issuesCounts[issue.severity] || 0) + 1;
                    }
                }
            }
        }

        return summary;
    }

    /**
     * Map folder name to type
     */
    mapFolderToType(folder) {
        const map = {
            'Mobs': 'mobs',
            'Skills': 'skills',
            'Items': 'items',
            'DropTables': 'droptables',
            'RandomSpawns': 'randomspawns'
        };
        return map[folder] || folder?.toLowerCase() || 'unknown';
    }

    /**
     * Generate pack details
     */
    generatePackDetails(scanResults, parseResults, validationResults) {
        return scanResults.packs.map(pack => {
            const parseData = parseResults.get(pack.name);
            const validation = validationResults.get(pack.name);

            return {
                name: pack.name,
                stats: pack.stats,
                folders: Object.entries(pack.folders).map(([name, folder]) => ({
                    name,
                    exists: folder.exists,
                    totalFiles: folder.totalFiles,
                    totalSize: folder.totalSize
                })),
                configFiles: {
                    packinfo: pack.configFiles.packinfo.exists,
                    tooltips: pack.configFiles.tooltips.exists
                },
                unknownFolders: pack.unknownFolders,
                parsing: parseData ? {
                    successfulFiles: parseData.successfulFiles,
                    failedFiles: parseData.failedFiles,
                    totalEntries: parseData.totalEntries,
                    totalErrors: parseData.totalErrors,
                    totalWarnings: parseData.totalWarnings
                } : null,
                validation: validation ? validation.summary : null
            };
        });
    }

    /**
     * Gather all issues
     */
    gatherAllIssues(parseResults, validationResults) {
        const issues = [];

        // Parse errors
        for (const [packName, parseData] of parseResults) {
            for (const file of parseData.files) {
                for (const error of file.errors) {
                    issues.push({
                        pack: packName,
                        file: file.relativePath,
                        line: error.line,
                        type: error.type,
                        severity: error.severity,
                        message: error.message,
                        source: 'parse'
                    });
                }
                for (const warning of file.warnings) {
                    issues.push({
                        pack: packName,
                        file: file.relativePath,
                        line: warning.line || warning.lines?.[0],
                        type: warning.type,
                        severity: warning.severity,
                        message: warning.message,
                        source: 'parse'
                    });
                }
            }
        }

        // Validation issues
        for (const [packName, validation] of validationResults) {
            if (!validation) continue;

            for (const fileResult of validation.validationResults) {
                for (const entry of fileResult.entries) {
                    for (const issue of entry.issues) {
                        issues.push({
                            pack: packName,
                            file: fileResult.relativePath,
                            entry: entry.name,
                            field: issue.field,
                            type: issue.type,
                            severity: issue.severity,
                            message: issue.message,
                            suggestion: issue.suggestion,
                            source: 'validation'
                        });
                    }
                }
            }
        }

        return issues;
    }

    /**
     * Gather cross-references
     */
    gatherCrossReferences(validationResults) {
        const refs = {
            skills: { resolved: [], missing: [] },
            items: { resolved: [], missing: [] },
            mobs: { resolved: [], missing: [] },
            droptables: { resolved: [], missing: [] }
        };

        for (const [packName, validation] of validationResults) {
            if (!validation || !validation.crossReferences) continue;

            const cr = validation.crossReferences;
            
            refs.skills.resolved.push(...(cr.resolvedReferences.skills || []));
            refs.skills.missing.push(...(cr.missingReferences.skills || []));
            
            refs.items.resolved.push(...(cr.resolvedReferences.items || []));
            refs.items.missing.push(...(cr.missingReferences.items || []));
            
            refs.mobs.resolved.push(...(cr.resolvedReferences.mobs || []));
            refs.mobs.missing.push(...(cr.missingReferences.mobs || []));
            
            refs.droptables.resolved.push(...(cr.resolvedReferences.droptables || []));
            refs.droptables.missing.push(...(cr.missingReferences.droptables || []));
        }

        // Remove duplicates
        for (const type of ['skills', 'items', 'mobs', 'droptables']) {
            refs[type].resolved = [...new Set(refs[type].resolved)];
        }

        return refs;
    }

    /**
     * Export report to file
     */
    exportReport(scanResults, parseResults, validationResults, format = 'markdown') {
        const report = this.generatePreImportReport(scanResults, parseResults, validationResults);
        let content, filename, mimeType;

        switch (format) {
            case 'json':
                content = JSON.stringify(report, null, 2);
                filename = 'mythicmobs-import-report.json';
                mimeType = 'application/json';
                break;
            case 'html':
                content = this.generateHtmlReport(report);
                filename = 'mythicmobs-import-report.html';
                mimeType = 'text/html';
                break;
            case 'markdown':
            default:
                content = this.generateMarkdownReport(report);
                filename = 'mythicmobs-import-report.md';
                mimeType = 'text/markdown';
                break;
        }

        this.downloadFile(content, filename, mimeType);
    }

    /**
     * Generate Markdown report
     */
    generateMarkdownReport(report) {
        let md = `# MythicMobs Import Report\n\n`;
        md += `**Generated:** ${new Date(report.generatedAt).toLocaleString()}\n\n`;

        // Summary
        md += `## Summary\n\n`;
        md += `- **Folder Type:** ${report.summary.folderType}\n`;
        md += `- **Total Packs:** ${report.summary.totalPacks}\n`;
        md += `- **Total Files:** ${report.summary.totalFiles}\n`;
        md += `- **Total Size:** ${report.summary.totalSize}\n\n`;

        // Statistics table
        md += `### Entry Statistics\n\n`;
        md += `| Type | Total | Valid | Warnings | Errors |\n`;
        md += `|------|-------|-------|----------|--------|\n`;
        for (const [type, stats] of Object.entries(report.summary.statistics)) {
            md += `| ${this.capitalize(type)} | ${stats.total} | ${stats.valid} | ${stats.warnings} | ${stats.errors} |\n`;
        }
        md += `\n`;

        // Issues summary
        md += `### Issues Summary\n\n`;
        md += `- ❌ **Critical:** ${report.summary.issuesCounts.critical || 0}\n`;
        md += `- ⚠️ **Warnings:** ${report.summary.issuesCounts.warning || 0}\n`;
        md += `- ℹ️ **Info:** ${report.summary.issuesCounts.info || 0}\n\n`;

        // Pack details
        md += `## Pack Details\n\n`;
        for (const pack of report.packs) {
            md += `### ${pack.name}\n\n`;
            md += `- **Files:** ${pack.stats.totalFiles}\n`;
            md += `- **Size:** ${pack.stats.totalSizeFormatted}\n\n`;

            if (pack.unknownFolders.length > 0) {
                md += `**Unknown Folders (skipped):** ${pack.unknownFolders.join(', ')}\n\n`;
            }
        }

        // Issues
        if (report.issues.length > 0) {
            md += `## Issues\n\n`;

            // Critical
            const critical = report.issues.filter(i => i.severity === 'critical');
            if (critical.length > 0) {
                md += `### ❌ Critical Errors (${critical.length})\n\n`;
                for (const issue of critical) {
                    md += `#### ${issue.file}${issue.line ? `:${issue.line}` : ''}\n`;
                    md += `- **Type:** ${issue.type}\n`;
                    md += `- **Message:** ${issue.message}\n`;
                    if (issue.suggestion) md += `- **Suggestion:** ${issue.suggestion}\n`;
                    md += `\n`;
                }
            }

            // Warnings
            const warnings = report.issues.filter(i => i.severity === 'warning');
            if (warnings.length > 0) {
                md += `### ⚠️ Warnings (${warnings.length})\n\n`;
                for (const issue of warnings.slice(0, 50)) { // Limit to 50
                    md += `- **${issue.file}** - ${issue.type}: ${issue.message}\n`;
                }
                if (warnings.length > 50) {
                    md += `\n*...and ${warnings.length - 50} more warnings*\n`;
                }
                md += `\n`;
            }
        }

        // Cross-references
        md += `## Cross-References\n\n`;
        const refs = report.crossReferences;
        
        md += `### Resolved References\n`;
        md += `- Skills: ${refs.skills.resolved.length}\n`;
        md += `- Items: ${refs.items.resolved.length}\n`;
        md += `- Mobs: ${refs.mobs.resolved.length}\n`;
        md += `- DropTables: ${refs.droptables.resolved.length}\n\n`;

        const totalMissing = refs.skills.missing.length + refs.items.missing.length + 
                           refs.mobs.missing.length + refs.droptables.missing.length;
        
        if (totalMissing > 0) {
            md += `### Missing References (will create placeholders)\n\n`;
            
            if (refs.skills.missing.length > 0) {
                md += `**Skills:**\n`;
                refs.skills.missing.forEach(m => {
                    md += `- ${m.name || m}\n`;
                });
                md += `\n`;
            }
            if (refs.items.missing.length > 0) {
                md += `**Items:**\n`;
                refs.items.missing.forEach(m => {
                    md += `- ${m.name || m}\n`;
                });
                md += `\n`;
            }
        }

        return md;
    }

    /**
     * Generate HTML report
     */
    generateHtmlReport(report) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>MythicMobs Import Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; background: #1a1a2e; color: #eee; }
        h1 { color: #4ade80; }
        h2 { color: #60a5fa; border-bottom: 2px solid #334155; padding-bottom: 8px; }
        h3 { color: #a78bfa; }
        table { border-collapse: collapse; width: 100%; margin: 16px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #334155; }
        th { background: #1e293b; }
        .critical { color: #ef4444; }
        .warning { color: #f59e0b; }
        .info { color: #3b82f6; }
        .success { color: #22c55e; }
        .card { background: #1e293b; border-radius: 8px; padding: 16px; margin: 16px 0; }
        .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; }
        .stat-item { background: #0f172a; padding: 16px; border-radius: 8px; text-align: center; }
        .stat-value { font-size: 24px; font-weight: bold; color: #4ade80; }
        .stat-label { color: #94a3b8; }
        .issue-item { background: #0f172a; padding: 12px; margin: 8px 0; border-radius: 4px; border-left: 4px solid; }
        .issue-item.critical { border-color: #ef4444; }
        .issue-item.warning { border-color: #f59e0b; }
    </style>
</head>
<body>
    <h1>📦 MythicMobs Import Report</h1>
    <p><strong>Generated:</strong> ${new Date(report.generatedAt).toLocaleString()}</p>

    <div class="card">
        <h2>📊 Summary</h2>
        <div class="stat-grid">
            <div class="stat-item">
                <div class="stat-value">${report.summary.totalPacks}</div>
                <div class="stat-label">Packs</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${report.summary.totalFiles}</div>
                <div class="stat-label">Files</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${report.summary.totalSize}</div>
                <div class="stat-label">Size</div>
            </div>
            <div class="stat-item">
                <div class="stat-value critical">${report.summary.issuesCounts.critical || 0}</div>
                <div class="stat-label">Errors</div>
            </div>
            <div class="stat-item">
                <div class="stat-value warning">${report.summary.issuesCounts.warning || 0}</div>
                <div class="stat-label">Warnings</div>
            </div>
        </div>
    </div>

    <h2>📁 Entry Statistics</h2>
    <table>
        <tr><th>Type</th><th>Total</th><th>Valid</th><th>Warnings</th><th>Errors</th></tr>
        ${Object.entries(report.summary.statistics).map(([type, stats]) => `
            <tr>
                <td>${this.capitalize(type)}</td>
                <td>${stats.total}</td>
                <td class="success">${stats.valid}</td>
                <td class="warning">${stats.warnings}</td>
                <td class="critical">${stats.errors}</td>
            </tr>
        `).join('')}
    </table>

    ${report.issues.filter(i => i.severity === 'critical').length > 0 ? `
        <h2>❌ Critical Errors</h2>
        ${report.issues.filter(i => i.severity === 'critical').map(issue => `
            <div class="issue-item critical">
                <strong>${issue.file}${issue.line ? `:${issue.line}` : ''}</strong><br>
                <span class="critical">${issue.type}:</span> ${issue.message}
                ${issue.suggestion ? `<br><em>💡 ${issue.suggestion}</em>` : ''}
            </div>
        `).join('')}
    ` : ''}

</body>
</html>`;
    }

    /**
     * Capitalize first letter
     */
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Download file
     */
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

window.ImportReportGenerator = ImportReportGenerator;
