import * as os from 'os';
import * as fs from 'fs';

export interface ContainerInfo {
  serviceName: string;
}
export class ContainerInfoUtil {
  private static instance: ContainerInfoUtil;
  private containerInfo: ContainerInfo;

  private constructor() {
    this.containerInfo = this.detectContainerInfo();
  }
  public static getInstance(): ContainerInfoUtil {
    if (!ContainerInfoUtil.instance) {
      ContainerInfoUtil.instance = new ContainerInfoUtil();
    }
    return ContainerInfoUtil.instance;
  }

  public getContainerInfo(): ContainerInfo {
    return this.containerInfo;
  }

  private detectContainerInfo(): ContainerInfo {
    return { serviceName: this.getServiceName() };
  }

  private getServiceName(): string {
    return (
      process.env.SERVICE_NAME ||
      process.env.APP_NAME ||
      process.env.npm_package_name ||
      'soundbox-backend'
    );
  }
}
export const containerInfo = ContainerInfoUtil.getInstance();
