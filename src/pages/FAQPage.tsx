import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function FAQPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-6 md:mb-8">
        <h1 className="text-2xl md:text-4xl font-bold mb-2">Frequently Asked Questions</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Common questions and answers about Stremio Account Manager
        </p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Is this an official Stremio tool?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              No. This is an unofficial tool and is not affiliated with Stremio in any way. Use it
              at your own risk.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What is this tool for?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This tool is designed for <strong>bulk Stremio account and addon management</strong>.
              It allows you to manage multiple Stremio accounts, install and remove addons across
              accounts, and sync configurations. This tool is{' '}
              <strong>not related to specific addons in any way, shape, or form</strong> - it is
              purely a management interface for your Stremio accounts and their addon
              configurations.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What risks are involved?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-muted-foreground">
              <p>Using it may break your Stremio profile or cause unexpected behavior.</p>
              <p>
                There is currently no way to 'reset' your addons to previous configurations or
                default configurations. We recommend exporting your configuration before making
                changes so you can restore it if needed.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Is my data stored in the cloud?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-muted-foreground">
              <p>
                No. This tool is completely client-side only. Everything is stored within your
                browser's local storage. We do not have any servers, and your data never leaves your
                device.
              </p>
              <p>
                <strong>Important:</strong> If you wipe your browser's cache or local storage, you
                will lose all your progress. This is why the import/export feature exists - make
                sure to regularly export your configuration as a backup.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Are my credentials safe?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-muted-foreground">
              <p>Your credentials are protected with industry-standard cryptographic encryption.</p>
              <p>
                <strong>How encryption works:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>
                  <strong>Master password:</strong> You set a password that encrypts all your
                  credentials. Without it, data cannot be decrypted.
                </li>
                <li>
                  <strong>Strong encryption:</strong> AES-256-GCM with PBKDF2-SHA256 (600,000
                  iterations) - industry standard cryptographic security.
                </li>
                <li>
                  <strong>Local storage only:</strong> Encrypted credentials stored in your
                  browser's IndexedDB. Never sent to any server except Stremio's official API.
                </li>
                <li>
                  <strong>Session-based:</strong> Your master password is never stored. You must
                  enter it when opening the app.
                </li>
              </ul>
              <p>
                <strong>Important:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>
                  ⚠️ <strong>Lost password = lost data.</strong> There is no recovery. Write down
                  your password or use a password manager.
                </li>
                <li>
                  ⚠️ <strong>Password required on startup.</strong> You'll need to unlock the app
                  each time.
                </li>
              </ul>
              <p>
                <strong>Best practices:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Use a strong password (8+ characters minimum)</li>
                <li>Store it in a password manager</li>
                <li>Use OS-level disk encryption (FileVault, BitLocker)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Can I view the source code?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-muted-foreground">
              <p>
                Absolutely! This project is fully open source and available on GitHub. You can view,
                audit, and even contribute to the code.
              </p>
              <p>
                <strong>Repository:</strong>{' '}
                <a
                  href="https://github.com/Asymons/stremio-account-manager"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  https://github.com/Asymons/stremio-account-manager
                </a>
              </p>
              <p>
                We encourage you to review the code to verify that there's no hidden functionality,
                malicious code, or data collection happening. Transparency is important to us, and
                we want you to feel confident about using this tool.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Can I use this to move Cinemeta catalogs from the top?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-muted-foreground">
              <p>
                Yes! This will allow you to move the Cinemeta provided catalogs (i.e., Popular -
                Series/Movie and Featured - Series/Movie) from the top of your catalog list.
              </p>
              <p>
                Do note that the in-built 'Continue watching' catalog cannot be moved from the top.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Why can't protected addons be removed?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-muted-foreground">
              <p>
                Protected addons are essential for Stremio's core functionality. For example,
                Cinemeta provides the metadata and catalog system that Stremio relies on. Removing
                these addons would break critical features of your Stremio profile, which is why
                they cannot be removed.
              </p>
              <p>
                Usually, people interested in removing protected addons are interested in removing
                Cinemeta. If you want to remove Cinemeta, you can refer to{' '}
                <a
                  href="https://cinebye.elfhosted.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  https://cinebye.elfhosted.com/
                </a>{' '}
                for a solution.
              </p>
              <p>
                If you don't want to risk breaking Stremio's core functionality, a reasonable
                alternative is to move the addon to the bottom of the list; however, there could be
                unexpected issues with this approach, although these haven't been observed yet in
                normal usage.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How do I get my AuthKey?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-muted-foreground">
              <p>
                Your AuthKey is a unique identifier that allows this tool to access your Stremio
                account and manage your addons. You can retrieve it directly from your browser's
                local storage when you're logged into Stremio's web interface.
              </p>
              <p>
                <strong>Note:</strong> Using your username and password is the easier option (and
                what we personally recommend), as it doesn't require accessing the developer
                console. However, if you don't feel comfortable entering your password, you can use
                your AuthKey instead by following the instructions below.
              </p>
              <p>
                <strong>Step-by-step instructions:</strong>
              </p>
              <ol className="list-decimal list-inside space-y-3 ml-2">
                <li>
                  <strong>Log into Stremio:</strong> Open your web browser and navigate to{' '}
                  <a
                    href="https://web.stremio.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    https://web.stremio.com/
                  </a>
                  . Make sure you're logged into your Stremio account.
                </li>
                <li>
                  <strong>Open the Developer Console:</strong> While on the Stremio website, open
                  your browser's developer console. The browser developer console is a tool which
                  logs the information associated with a web application, such as network requests
                  and errors. It also allows you to interact with the loaded web page using
                  JavaScript. Most modern browsers have a developer console built in.
                  <div className="mt-2 space-y-1">
                    <p className="font-medium">To open the developer console:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>
                        <strong>Chrome/Edge:</strong> Press{' '}
                        <kbd className="bg-muted px-1.5 py-0.5 rounded text-xs">F12</kbd> or{' '}
                        <kbd className="bg-muted px-1.5 py-0.5 rounded text-xs">Ctrl+Shift+I</kbd>{' '}
                        (Windows/Linux) or{' '}
                        <kbd className="bg-muted px-1.5 py-0.5 rounded text-xs">Cmd+Option+I</kbd>{' '}
                        (Mac)
                      </li>
                      <li>
                        <strong>Firefox:</strong> Press{' '}
                        <kbd className="bg-muted px-1.5 py-0.5 rounded text-xs">F12</kbd> or{' '}
                        <kbd className="bg-muted px-1.5 py-0.5 rounded text-xs">Ctrl+Shift+K</kbd>{' '}
                        (Windows/Linux) or{' '}
                        <kbd className="bg-muted px-1.5 py-0.5 rounded text-xs">Cmd+Option+K</kbd>{' '}
                        (Mac)
                      </li>
                      <li>
                        <strong>Safari:</strong> Enable "Show Develop menu" in Preferences, then
                        press{' '}
                        <kbd className="bg-muted px-1.5 py-0.5 rounded text-xs">Cmd+Option+C</kbd>
                      </li>
                    </ul>
                  </div>
                </li>
                <li>
                  <strong>Run the command:</strong> In the console, you'll see a prompt where you
                  can type commands. Copy and paste the following command exactly as shown:
                  <div className="mt-2 p-3 bg-muted rounded-md">
                    <code className="text-sm">
                      JSON.parse(localStorage.getItem("profile")).auth.key
                    </code>
                  </div>
                  Press{' '}
                  <kbd className="bg-background border px-1.5 py-0.5 rounded text-xs">Enter</kbd> to
                  execute the command.
                </li>
                <li>
                  <strong>Copy your AuthKey:</strong> The console will display your AuthKey as a
                  string of characters (it will look something like a long alphanumeric code).
                  Select and copy this entire value. Be careful to copy the complete key - it should
                  be quite long.
                </li>
                <li>
                  <strong>Paste into the AuthKey field:</strong> Return to this application, click
                  "Add Account", select the "Auth Key" option, and paste the copied value into the
                  AuthKey field.
                </li>
              </ol>
              <p className="pt-2">
                <strong>Note:</strong> Your AuthKey is sensitive information that provides access to
                your Stremio account. Keep it secure and never share it with others. This tool
                stores your AuthKey encrypted in your browser's local storage for your convenience.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How do import and backups work?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-muted-foreground">
              <p>
                The import/export feature allows you to save and restore your account configurations
                and saved addons. When you export, you'll receive a JSON file containing all your
                data.
              </p>
              <p>You can use this file to:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Backup your configurations before making changes</li>
                <li>Transfer your setup to another browser or device</li>
                <li>Restore your configuration if something goes wrong</li>
              </ul>
              <p>
                To import, simply use the Import button and select a previously exported JSON file.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
