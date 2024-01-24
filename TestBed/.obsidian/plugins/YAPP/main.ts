import { App, ButtonComponent, Editor, MarkdownView, Modal, WorkspaceLeaf, Notice, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';
import { CustomLeaf, NodePosition, Workspaces, GraphData } from "types";
// Remember to rename these classes and interfaces!

interface YAPPSettings {
  DefaultName: string;
}

const DEFAULT_SETTINGS: YAPPSettings = {
  DefaultName: "Root",
};

export default class YAPP extends Plugin {
  settings: YAPPSettings;

  async onload() {
    await this.loadSettings();

    // This creates an icon in the left ribbon.
    const ribbonIconEl = this.addRibbonIcon(
      "dice",
      "Sample Plugin",
      (evt: MouseEvent) => {
        // Called when the user clicks the icon.
        new Notice("This is a notice!");
      }
    );
    // Perform additional things with the ribbon
    ribbonIconEl.addClass("my-plugin-ribbon-class");

    // This adds a status bar item to the bottom of the app. Does not work on mobile apps.
    const StatusBarNotice = this.addStatusBarItem();
    StatusBarNotice.setText("YAPP ACTIVE");

    // This adds a simple command that can be triggered anywhere
    this.addCommand({
      id: "rescan",
      name: "Re-Scan",
      callback: () => {
        console.log("Re-scanning the active directory for file changes...");
        new DisplayBox(
          this.app,
          "Re-Scanning",
          "Checking your active obsidian vault for file changes, appending any changes to the graph display."
        ).open();
        this.addPropertiesToAllFiles();
      },
    });
    
    // This adds an editor command that can perform some operation on the current editor instance

    //this.addCommand({
    //	id: 'sample-editor-command',
    //	name: 'Sample editor command',
    //	editorCallback: (editor: Editor, view: MarkdownView) => {
    //		console.log(editor.getSelection());
    //		editor.replaceSelection('Sample Editor Command'); // inserts text object
    //	}
    //});

    // This adds a complex command that can check whether the current state of the app allows execution of the command

    //this.addCommand({
    //	id: 'open-sample-modal-complex',
    //	name: 'Open sample modal (complex)',
    //	checkCallback: (checking: boolean) => {
    //		// Conditions to check
    //		const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
    //		if (markdownView) {
    //			// If checking is true, we're simply "checking" if the command can be run.
    //			// If checking is false, then we want to actually perform the operation.
    //			if (!checking) {
    //				new DisplayBox(this.app, "Test Command", `Description of the command:${checking}`).open();
    //			}
    //
    //			// This command will only show up in Command Palette when the check function returns true
    //			return true;
    //		}
    //	}
    //});

    // This adds a settings tab so the user can configure various aspects of the plugin
    this.addSettingTab(new SettingsTab(this.app, this));

    // If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
    // Using this function will automatically remove the event listener when this plugin is disabled.
    this.registerDomEvent(document, "click", (evt: MouseEvent) => {
      console.log("click", evt);
    });

    // When registering intervals, this function will automatically clear the interval when the plugin is disabled.
    this.registerInterval(
      window.setInterval(() => console.log("setInterval"), 5 * 60 * 1000)
    );
  }

  addPropertiesToAllFiles() {
    // Get all files in the vault
    const allFiles = this.app.vault.getFiles();

    // Iterate over each file
    for (const file of allFiles) {
      // Check if the file is a markdown file
      
      if (file.extension === "md") {
        console.log(`${file.name} is a child of ${file.parent.name}`);
        const frontMatter = this.app.metadataCache.getFileCache(file)?.frontmatter; //gets all file properties stored in a file
        if (frontMatter) {
          console.log("Front Matter:", frontMatter);
        }
        this.modifyFile(file, "\n---\nnew_property: new_value");

      } else {
        console.log(file.parent.name)

      }
    }
  }
  
  async modifyFile(file: TFile, newcontent: string) {
    const metadata = this.app.metadataCache.getFileCache(file)?.frontmatter;

    if (metadata) {
      // Modify the existing metadata or add a new property
      metadata.new_property = "new_value";

      // Save the modified metadata
      this.app.fileManager.processFrontMatter(file, (fm) => {
        fm.frontmatter = metadata;
        return fm;
      }
      );
    } else {
      console.log("No metadata found for the file.");
    }
  }

  onunload() {
    console.log("Unloading...");
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

class DisplayBox extends Modal {
	Header : string;
	Message : string;
	constructor(app: App, Header: string, Message: string) {
		super(app);
		this.Header = Header;
		this.Message = Message;
		
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.createEl("h1", { text: this.Header });
		contentEl.createEl("div", { text: this.Message });
		//contentEl.setText(`${this.Message}`);

		new ButtonComponent(contentEl)
			.setButtonText("Close")
			.onClick(() => {
				this.close();
			});
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class SettingsTab extends PluginSettingTab {
	plugin: YAPP;

	constructor(app: App, plugin: YAPP) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl("h1", { text: "YAPP Settings Menu" });
		containerEl.createEl("h6", { text: "Yet Another Productivity Plugin", cls: "name_description"});

		new Setting(containerEl)
      .setName("Default Name")
      .setDesc("Set the name for your root node")
      .addText((text) =>
        text
          .setPlaceholder("Root Node Name")
          .setValue(this.plugin.settings.DefaultName)
          .onChange(async (value) => {
            this.plugin.settings.DefaultName = value;
            await this.plugin.saveSettings();
          })
      );
	}
}
