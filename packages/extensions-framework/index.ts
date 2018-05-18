import { ContainerModule } from "inversify";
import Application, { ApplicationExtension } from "./src/Application";
import {
  bindExtensionProvider,
  ExtensionProvider,
  IExtensionProvider
} from "./src/ExtensionProvider";
import Container from "./src/Container";

export {
  Application,
  ApplicationExtension,
  Container,
  ExtensionProvider,
  IExtensionProvider,
  bindExtensionProvider
};

export default new ContainerModule((bind, _unbind) => {
  bindExtensionProvider(bind, ApplicationExtension);
  bind(Application).toSelf().inSingletonScope();
});
