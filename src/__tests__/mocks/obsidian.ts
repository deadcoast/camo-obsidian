// Mock Obsidian API
export const Plugin = class MockPlugin {
  app: any;
  manifest: any;
  settings: any;

  constructor() {
    this.app = {
      workspace: {
        getActiveFile: jest.fn(),
        onLayoutReady: jest.fn(),
        on: jest.fn(),
      },
      vault: {
        adapter: {
          read: jest.fn(),
          write: jest.fn(),
        },
      },
      loadData: jest.fn(),
      saveData: jest.fn(),
    };
    this.manifest = {};
    this.settings = {};
  }

  addCommand = jest.fn();
  addSettingTab = jest.fn();
  addRibbonIcon = jest.fn();
  registerMarkdownPostProcessor = jest.fn();
  registerDomEvent = jest.fn();
  registerInterval = jest.fn();
  registerCodeBlockProcessor = jest.fn();
};

export const Notice = jest.fn();
export const Modal = class MockModal {
  app: any;
  contentEl: any;

  constructor(app: any) {
    this.app = app;
    this.contentEl = {
      empty: jest.fn(),
      createEl: jest.fn(() => ({
        setText: jest.fn(),
        setPlaceholder: jest.fn(),
        onChange: jest.fn(),
      })),
    };
  }

  open = jest.fn();
  close = jest.fn();
};

export const Setting = class MockSetting {
  setName = jest.fn().mockReturnThis();
  setDesc = jest.fn().mockReturnThis();
  addText = jest.fn().mockReturnThis();
  addToggle = jest.fn().mockReturnThis();
  addDropdown = jest.fn().mockReturnThis();
  addSlider = jest.fn().mockReturnThis();
};

export const Platform = {
  isMobile: false,
  isTablet: false,
  isDesktop: true,
};

export const MarkdownPostProcessorContext = class MockContext {
  sourcePath: string;
  docId: string;

  constructor() {
    this.sourcePath = 'test.md';
    this.docId = 'test-doc';
  }
};

export const Editor = class MockEditor {
  getValue = jest.fn();
  setValue = jest.fn();
  getCursor = jest.fn();
  setCursor = jest.fn();
  getSelection = jest.fn();
  replaceSelection = jest.fn();
};

export const App = class MockApp {
  workspace: any;
  vault: any;

  constructor() {
    this.workspace = {
      getActiveFile: jest.fn(),
      onLayoutReady: jest.fn(),
      on: jest.fn(),
    };
    this.vault = {
      adapter: {
        read: jest.fn(),
        write: jest.fn(),
      },
    };
  }

  loadData = jest.fn();
  saveData = jest.fn();
};
