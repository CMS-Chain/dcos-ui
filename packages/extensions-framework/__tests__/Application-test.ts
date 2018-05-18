import Container from "../src/Container";
import Application, {
  ApplicationExtension,
  IApplicationExtension
} from "../src/Application";
import { ContainerModule, injectable } from "inversify";
import { bindExtensionProvider } from "extensions-framework";

const onStartMock = jest.fn();

@injectable()
class ExtensionMock implements IApplicationExtension {
  public onStart() {
    onStartMock();
  }
}

const mockModule = new ContainerModule(bind => {
  bindExtensionProvider(bind, ApplicationExtension);
});

const container = new Container();

describe("Application", () => {
  beforeEach(() => {
    container.load(mockModule);
    container.bind(Application).toSelf();
    container.bind(ApplicationExtension).to(ExtensionMock);
  });

  afterEach(() => {
    container.unbind(Application);
    container.unbind(ApplicationExtension);
    container.unload(mockModule);
  });

  describe("start", () => {
    it("calls onStart on all available extensions", () => {
      const app = container.get(Application);
      app.start();

      expect(onStartMock).toHaveBeenCalled();
    });
  });
});
