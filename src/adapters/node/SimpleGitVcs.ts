// VersionControlPort 的 node 实现: 包裹 simple-git。构建期唯一接触 simple-git 的位置。
import type { VersionControlPort, VcsLogResult } from '../../core/ports/VersionControlPort'
import simpleGit, { type SimpleGit } from 'simple-git'

export class SimpleGitVcs implements VersionControlPort {
  private readonly git: SimpleGit = simpleGit()

  log(options?: Record<string, unknown>): Promise<VcsLogResult> {
    return this.git.log(options as any) as unknown as Promise<VcsLogResult>
  }
  show(ref: string): Promise<string> {
    return this.git.show(ref)
  }
}

export const simpleGitVcs = new SimpleGitVcs()
