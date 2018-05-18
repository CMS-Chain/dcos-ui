import Container from "../src/Container";
import { ExtensionProvider } from "../src/ExtensionProvider";

describe("ExtensionProvider", () => {
  const container = new Container();
  const TestServiceExtension = Symbol("TestServiceExtension");

  beforeAll(() => {
    container.bind(ExtensionProvider)
      .toDynamicValue(
        context =>
          new ExtensionProvider(TestServiceExtension, context.container as Container)
      )
      .inSingletonScope()
      .whenTargetNamed(TestServiceExtension);
  });

  describe("getAllExtensions", () => {
    beforeEach(() => {
      container.bind(TestServiceExtension).toConstantValue(42);
    });
    afterEach(() => {
      container.unbind(TestServiceExtension);
    });

    it("returns all extensions", () => {
      const provider = container.getNamed(ExtensionProvider, TestServiceExtension);

      expect(provider.getAllExtensions()).toEqual([42]);
    });
  });

  describe("getTaggedExtensions", () => {
    beforeEach(() => {
      container.bind(TestServiceExtension).toConstantValue(42).whenTargetTagged("tag", "dcos");
    });
    afterEach(() => {
      container.unbind(TestServiceExtension);
    });

    it("returns all tagged extensions", () => {
      const provider = container.getNamed(ExtensionProvider, TestServiceExtension);

      expect(provider.getTaggedExtensions("tag", "dcos")).toEqual([42]);
    });
  });
});
