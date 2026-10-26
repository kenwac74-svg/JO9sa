using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;
using System.Web.Script.Serialization;
using System.Windows.Forms;

[assembly: AssemblyTitle("잭 오 나인 테일즈 2.4 간소 패치 설치")]
[assembly: AssemblyProduct("JO9 2.4 SAnk 간소 패치")]
[assembly: AssemblyCompany("SAnk")]
[assembly: AssemblyVersion("2.4.0.2")]

// JO9 MOD START KOREAN_PATCH_LAUNCHER | 2026-10-19_korean_patch_launcher
// The launcher delegates all preservation, validation and writes to the unchanged packaged installer.
namespace JO9PatchInstaller
{
    public sealed class InstallResult
    {
        public bool Success;
        public int ExitCode;
        public string Status = "ERROR";
        public string Message = "";
        public string BackupDirectory = "";
        public string Details = "";
        public Dictionary<string, object> Core;
        public string ToJson()
        {
            return new JavaScriptSerializer().Serialize(new Dictionary<string, object> {
                {"success",Success},{"status",Status},{"message",Message},
                {"backupDirectory",BackupDirectory},{"details",Details},{"core",Core}
            });
        }
    }

    public static class InstallerRunner
    {
        public static string NormalizeGameDirectory(string selected)
        {
            string value = (selected ?? "").Trim();
            if (value.Length >= 2 && value[0] == '"' && value[value.Length - 1] == '"') value = value.Substring(1, value.Length - 2);
            if (value.Length == 0) throw new ArgumentException("기존 게임 폴더를 선택해 주세요.");
            string folder;
            try { folder = Path.GetFullPath(value); }
            catch { throw new ArgumentException("올바른 게임 폴더 경로를 입력해 주세요."); }
            if (Directory.Exists(folder) && File.Exists(Path.Combine(folder, "jack.qsp"))) return folder;
            string child = Path.Combine(folder, "game");
            if (Directory.Exists(child) && File.Exists(Path.Combine(child, "jack.qsp"))) return child;
            throw new ArgumentException("게임 폴더를 찾지 못했습니다. jack.qsp가 있는 game 폴더 또는 그 상위 설치 폴더를 선택해 주세요.");
        }

        private static string QuoteArgument(string value)
        {
            var quoted = new StringBuilder("\""); int slashes = 0;
            foreach (char c in value)
            {
                if (c == '\\') { slashes++; continue; }
                quoted.Append('\\', c == '"' ? slashes * 2 + 1 : slashes); quoted.Append(c); slashes = 0;
            }
            quoted.Append('\\', slashes * 2); quoted.Append('"'); return quoted.ToString();
        }
        private static bool SameFolder(string left, string right)
        {
            return Path.GetFullPath(left).TrimEnd('\\', '/').Equals(Path.GetFullPath(right).TrimEnd('\\', '/'), StringComparison.OrdinalIgnoreCase);
        }
        private static InstallResult Failure(string message, string details, int exit)
        {
            return new InstallResult { Success = false, ExitCode = exit, Message = message, Details = details ?? "" };
        }
        private static string LocalizedError(string error, bool dryRun)
        {
            string value = (error ?? "").ToLowerInvariant();
            string reason;
            if (value.Contains("payload sha/hash") || value.Contains("payload changed")) reason = "패치 파일이 손상되었거나 원래 목록과 일치하지 않습니다. 압축을 새 폴더에 다시 풀어 주세요.";
            else if (value.Contains("external prerequisite") || value.Contains("receiver resource source")) reason = "필요한 원본 게임 또는 외부 팩의 파일이 없습니다. 필요한 팩을 먼저 설치해 주세요.";
            else if (value.Contains("existing physical (2)")) reason = "기존 (2) 추가 그림이 보존 원본과 다릅니다. 해당 그림을 보관하고 상세 경로의 충돌을 확인해 주세요.";
            else if (value.Contains("original unavailable") || value.Contains("original source")) reason = "보존할 원본 그림을 찾지 못했습니다. 패치 이전의 그림이나 따로 보관한 원본을 복원해 주세요.";
            else if (value.Contains("reparse") || value.Contains("unsafe") || value.Contains("escaped its root")) reason = "선택 경로에 지원하지 않는 연결 폴더 또는 잘못된 경로가 있습니다. 실제 게임 폴더를 선택해 주세요.";
            else if (value.Contains("read-only") || value.Contains("access") || value.Contains("액세스") || value.Contains("권한")) reason = "파일 쓰기 권한이나 읽기 전용 상태를 확인해 주세요. 게임을 종료하고 설치 폴더의 상태를 확인해 주세요.";
            else if (value.Contains("missing required") || value.Contains("manifest")) reason = "설치에 필요한 파일이 없거나 목록이 올바르지 않습니다. 전체 압축을 다시 풀고 상세 내용을 확인해 주세요.";
            else if (value.Contains("changed after preflight") || value.Contains("appeared after preflight")) reason = "검사 뒤에 게임 파일이 바뀌었습니다. 다른 편집 작업과 게임을 종료한 뒤 다시 확인해 주세요.";
            else reason = "상세 내용을 확인해 주세요.";
            if (dryRun) return "설치 전 검사를 통과하지 못했습니다.\r\n" + reason + "\r\n검사만 수행했으며 패치는 설치하지 않았습니다.";
            return "패치 설치를 완료하지 못했습니다.\r\n" + reason + "\r\n일부 파일이 변경되었을 수 있으므로 백업 폴더와 상세 내용을 확인해 주세요.";
        }

        public static InstallResult Run(string packageDirectory, string selected, bool dryRun)
        {
            string game, script, bridge, package;
            try
            {
                package = Path.GetFullPath(packageDirectory);
                script = Path.Combine(package, "Install-Patch.ps1");
                bridge = Path.Combine(package, "Install-Bridge.ps1");
                if (!File.Exists(script) || !File.Exists(bridge) || !File.Exists(Path.Combine(package, "BUILD_MANIFEST.json")))
                    throw new ArgumentException("설치 파일을 찾지 못했습니다. 실행 파일만 꺼내지 말고 압축 전체를 새 폴더에 풀어 주세요.");
                game = NormalizeGameDirectory(selected);
                if (SameFolder(game, Path.Combine(package, "game")))
                    throw new ArgumentException("패치가 든 폴더를 선택했습니다. 패치를 적용할 기존 게임 폴더를 선택해 주세요.");
            }
            catch (Exception ex) { return Failure(ex.Message, ex.Message, 2); }

            // Use a readable packaged script file; paths are ordinary Win32 argument values, never PowerShell source.
            string arguments = "-NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass -File " + QuoteArgument(bridge) +
                " -GameDirectory " + QuoteArgument(game) + (dryRun ? " -DryRun" : "");
            string output = "", error = "";
            int processExit;
            try
            {
                var start = new ProcessStartInfo {
                    FileName = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System), "WindowsPowerShell\\v1.0\\powershell.exe"),
                    Arguments = arguments,
                    WorkingDirectory = package, UseShellExecute = false, CreateNoWindow = true,
                    RedirectStandardOutput = true, RedirectStandardError = true,
                    StandardOutputEncoding = new UTF8Encoding(false), StandardErrorEncoding = new UTF8Encoding(false)
                };
                using (var process = new Process { StartInfo = start })
                {
                    process.Start();
                    Task<string> outputRead = process.StandardOutput.ReadToEndAsync();
                    Task<string> errorRead = process.StandardError.ReadToEndAsync();
                    // Never terminate an in-progress installation on an arbitrary timeout.
                    process.WaitForExit(); Task.WaitAll(outputRead, errorRead);
                    output = outputRead.Result; error = errorRead.Result; processExit = process.ExitCode;
                }
            }
            catch (Exception ex) { return Failure("설치 도구를 실행하지 못했습니다. Windows PowerShell 실행 가능 여부를 확인해 주세요.", ex.Message, 2); }
            string details = output.Trim() + (error.Length > 0 ? "\r\n\r\n" + error.Trim() : "");
            if (processExit != 0) return Failure(LocalizedError(error, dryRun), details, 1);
            Dictionary<string, object> core;
            string status;
            try
            {
                core = new JavaScriptSerializer().Deserialize<Dictionary<string, object>>(output.Trim().TrimStart('\uFEFF'));
                status = (string)core["status"];
                if ((dryRun && status != "DRY_RUN") || (!dryRun && status != "INSTALLED" && status != "ALREADY_INSTALLED")) throw new FormatException();
                if (!core.ContainsKey("payloadFiles") || !core.ContainsKey("payloadChanged")) throw new FormatException();
            }
            catch
            {
                return Failure("설치 도구의 결과를 확인할 수 없습니다. 완료로 처리하지 않았습니다. 상세 내용을 확인해 주세요." +
                    (dryRun ? "" : "\r\n일부 파일이 변경되었을 수 있으므로 백업도 확인해 주세요."), details, 3);
            }
            string backup = core.ContainsKey("backupDirectory") ? Convert.ToString(core["backupDirectory"]) : "";
            string message = status == "DRY_RUN" ? "설치 전 검사를 통과했습니다.\r\n아직 게임 파일을 바꾸지 않았습니다. 패치 설치를 누르면 적용합니다." :
                status == "ALREADY_INSTALLED" ? "이미 같은 패치가 설치되어 있습니다.\r\n파일을 다시 바꾸거나 새 백업을 만들지 않았습니다." : "패치 설치가 완료되었습니다.\r\n게임을 새로 실행해 주세요.";
            return new InstallResult { Success = true, ExitCode = 0, Status = status, Message = message, BackupDirectory = backup, Details = details, Core = core };
        }
    }

    public sealed class InstallerForm : Form
    {
        private readonly string package = AppDomain.CurrentDomain.BaseDirectory;
        private readonly TextBox folder = new TextBox { Name = "gameFolder", Dock = DockStyle.Fill };
        private readonly Button browse = MakeButton("폴더 선택", "browse");
        private readonly Button check = MakeButton("설치 전 검사", "check");
        private readonly Button install = MakeButton("패치 설치", "install");
        private readonly Button guide = MakeButton("안내 보기", "guide");
        private readonly Button close = MakeButton("닫기", "close");
        private readonly Label state = new Label { Name = "state", Text = "기존 게임 폴더를 선택해 주세요.", AutoSize = true, Dock = DockStyle.Fill, Padding = new Padding(0, 8, 0, 8) };
        private readonly TextBox summary = new TextBox { Name = "summary", Multiline = true, ReadOnly = true, Dock = DockStyle.Fill, ScrollBars = ScrollBars.Vertical, BackColor = Color.White, Text = "① 게임을 종료하고 패치 압축을 별도 폴더에 완전히 풉니다.\r\n② 기존 게임 폴더를 선택합니다.\r\n③ 설치 전 검사 또는 패치 설치를 누릅니다.\r\n\r\n기존 세이브와 외부 인물 자료는 자동으로 덮어쓰지 않습니다." };
        private readonly TextBox details = new TextBox { Name = "details", Multiline = true, ReadOnly = true, Dock = DockStyle.Fill, ScrollBars = ScrollBars.Both, WordWrap = false, BackColor = Color.White, Visible = false };
        private readonly CheckBox showDetails = new CheckBox { Name = "showDetails", Text = "상세 로그 보기 (기술 원문)", AutoSize = true };
        private readonly ProgressBar progress = new ProgressBar { Name = "progress", Dock = DockStyle.Fill, Style = ProgressBarStyle.Marquee, Visible = false, Height = 10, MarqueeAnimationSpeed = 35 };
        private bool busy;
        private static Button MakeButton(string text, string name) { return new Button { Name = name, Text = text, AutoSize = true, MinimumSize = new Size(112, 32), Margin = new Padding(0, 0, 10, 0) }; }
        private static Label TextLabel(string text) { return new Label { Text = text, AutoSize = true, Dock = DockStyle.Fill, Margin = new Padding(0, 0, 0, 8) }; }
        public InstallerForm()
        {
            Text = "잭 오 나인 테일즈 2.4 · 간소 패치 설치";
            Name = "koreanPatchInstaller"; Font = new Font("맑은 고딕", 10F);
            AutoScaleMode = AutoScaleMode.Dpi; AutoScaleDimensions = new SizeF(96F, 96F);
            ClientSize = new Size(790, 630); MinimumSize = new Size(760, 600); StartPosition = FormStartPosition.CenterScreen;
            var layout = new TableLayoutPanel { Name = "mainLayout", Dock = DockStyle.Fill, Padding = new Padding(22), ColumnCount = 1, RowCount = 11 };
            for (int i = 0; i < 11; i++) layout.RowStyles.Add(new RowStyle(i == 8 ? SizeType.Percent : SizeType.AutoSize, i == 8 ? 100F : 0F));
            var title = TextLabel("2.4 간소 패치 설치"); title.Font = new Font(Font.FontFamily, 18F, FontStyle.Bold); layout.Controls.Add(title, 0, 0);
            layout.Controls.Add(TextLabel("설치 순서: 게임 본체 → 올걸팩·사용할 외부 패치 → 이 간소 패치(마지막)\r\n외부 팩 설치를 모두 마친 기존 게임 폴더를 선택해 주세요.\r\n게임을 종료해 주세요. 바뀌는 기존 파일은 백업하며 세이브는 포함하지 않습니다."), 0, 1);
            layout.Controls.Add(TextLabel("적용할 기존 게임 폴더"), 0, 2);
            var folderRow = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 2, AutoSize = true, Margin = new Padding(0, 0, 0, 5) };
            folderRow.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100)); folderRow.ColumnStyles.Add(new ColumnStyle(SizeType.AutoSize));
            folder.Margin = new Padding(0, 3, 12, 3); folderRow.Controls.Add(folder, 0, 0); folderRow.Controls.Add(browse, 1, 0); layout.Controls.Add(folderRow, 0, 3);
            var hint = TextLabel("jack.qsp가 있는 game 폴더 또는 그 상위 폴더를 선택할 수 있습니다."); hint.ForeColor = Color.DimGray; layout.Controls.Add(hint, 0, 4);
            var actions = new FlowLayoutPanel { Dock = DockStyle.Fill, AutoSize = true, WrapContents = true, Margin = new Padding(0, 7, 0, 0) };
            actions.Controls.Add(check); actions.Controls.Add(install); actions.Controls.Add(guide); layout.Controls.Add(actions, 0, 5);
            layout.Controls.Add(state, 0, 6); layout.Controls.Add(progress, 0, 7); layout.Controls.Add(summary, 0, 8);
            var detailBox = new TableLayoutPanel { Name = "detailBox", Dock = DockStyle.Fill, AutoSize = true, ColumnCount = 1, RowCount = 2, Margin = new Padding(0, 10, 0, 0) };
            detailBox.RowStyles.Add(new RowStyle(SizeType.AutoSize)); detailBox.RowStyles.Add(new RowStyle(SizeType.Absolute, 0));
            detailBox.Controls.Add(showDetails, 0, 0); detailBox.Controls.Add(details, 0, 1); layout.Controls.Add(detailBox, 0, 9);
            var footer = new FlowLayoutPanel { Dock = DockStyle.Fill, FlowDirection = FlowDirection.RightToLeft, AutoSize = true, Margin = new Padding(0, 12, 0, 0) }; close.Margin = new Padding(0); footer.Controls.Add(close); layout.Controls.Add(footer, 0, 10); Controls.Add(layout);
            showDetails.CheckedChanged += delegate { details.Visible = showDetails.Checked; detailBox.RowStyles[1].Height = showDetails.Checked ? 130 : 0; };
            folder.TextChanged += delegate { if (!busy) { state.ForeColor = SystemColors.ControlText; state.Text = "게임 폴더가 바뀌었습니다. 설치 전 검사로 확인해 주세요."; summary.Text = "선택한 게임 폴더에 패치를 적용합니다. 설치할 때에도 파일을 다시 검사합니다."; details.Clear(); showDetails.Checked = false; } };
            browse.Click += delegate { using (var dialog = new FolderBrowserDialog { Description = "기존 잭 오 나인 테일즈 게임 폴더를 선택해 주세요.", ShowNewFolderButton = false }) { if (Directory.Exists(folder.Text)) dialog.SelectedPath = folder.Text; if (dialog.ShowDialog(this) == DialogResult.OK) folder.Text = dialog.SelectedPath; } };
            check.Click += async delegate { await StartOperation(true); };
            install.Click += async delegate { await StartOperation(false); };
            guide.Click += delegate { try { Process.Start(new ProcessStartInfo { FileName = Path.Combine(package, "README_INSTALL.txt"), UseShellExecute = true }); } catch (Exception ex) { summary.Text = "설치 안내를 열지 못했습니다. 압축 폴더의 README_INSTALL.txt를 직접 열어 주세요.\r\n" + ex.Message; } };
            close.Click += delegate { Close(); };
            FormClosing += delegate(object sender, FormClosingEventArgs e) { if (busy) { e.Cancel = true; state.Text = "작업이 끝난 뒤 닫을 수 있습니다. 설치 파일을 복사하는 중에는 기다려 주세요."; } };
        }
        private async Task StartOperation(bool dryRun)
        {
            if (busy) return;
            busy = true; browse.Enabled = check.Enabled = install.Enabled = close.Enabled = folder.Enabled = false; progress.Visible = true;
            state.Text = dryRun ? "설치 전 검사 중입니다. 파일 수에 따라 시간이 걸릴 수 있습니다." : "검사·백업·설치 중입니다. 완료될 때까지 기다려 주세요.";
            summary.Text = ""; details.Text = "";
            string selected = folder.Text;
            try { selected = InstallerRunner.NormalizeGameDirectory(selected); folder.Text = selected; } catch (ArgumentException) { /* The shared runner returns the localized validation error. */ }
            try
            {
                InstallResult result = await Task.Run(() => InstallerRunner.Run(package, selected, dryRun));
                summary.Text = result.Message;
                if (result.Success && result.Core != null)
                {
                    summary.AppendText("\r\n\r\n패치 목록: " + result.Core["payloadFiles"] + "개\r\n" + (dryRun ? "변경 예정" : "적용 파일") + ": " + result.Core["payloadChanged"] + "개");
                    if (!String.IsNullOrEmpty(result.BackupDirectory)) summary.AppendText("\r\n\r\n기존 파일 백업 위치:\r\n" + result.BackupDirectory);
                }
                details.Text = result.Details; state.Text = result.Success ? (dryRun ? "검사 완료 · 패치 설치를 누르면 적용합니다." : "완료") : "완료하지 못했습니다 · 아래 안내를 확인해 주세요.";
                state.ForeColor = result.Success ? Color.DarkGreen : Color.Firebrick;
            }
            catch (Exception ex) { summary.Text = "작업 결과를 표시하지 못했습니다. 백업 폴더와 상세 내용을 확인해 주세요."; details.Text = ex.ToString(); state.Text = "확인이 필요합니다."; }
            finally { busy = false; progress.Visible = false; browse.Enabled = check.Enabled = install.Enabled = close.Enabled = folder.Enabled = true; }
        }
    }

    internal static class Program
    {
        [STAThread]
        private static int Main(string[] args)
        {
            if (args.Length > 0)
            {
                InstallResult result;
                if (args.Length == 2 && (args[0] == "--check" || args[0] == "--install")) result = InstallerRunner.Run(AppDomain.CurrentDomain.BaseDirectory, args[1], args[0] == "--check");
                else result = new InstallResult { ExitCode = 2, Message = "사용할 수 없는 인수입니다. 실행 파일을 더블클릭하거나 --check 또는 --install 뒤에 게임 폴더를 지정해 주세요." };
                using (var writer = new StreamWriter(Console.OpenStandardOutput(), new UTF8Encoding(false))) { writer.WriteLine(result.ToJson()); }
                return result.ExitCode;
            }
            Application.EnableVisualStyles(); Application.SetCompatibleTextRenderingDefault(false); Application.Run(new InstallerForm()); return 0;
        }
    }
}
// JO9 MOD END KOREAN_PATCH_LAUNCHER
