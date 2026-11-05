import type { RuntimeProvider } from '../domain/Model.js';
import type { RequestPermit } from './RequestPermit.js';

/** 将用户 effort 映射为协议字段。default 必须省略 Pi 推导字段；最终总结必须显式禁用工具。 */
export function modelPayloadPolicy(
  provider: RuntimeProvider,
  permit: RequestPermit,
) {
  return (value: unknown) => {
    const body = value as Record<string, unknown>;
    // "default" means omission, including Pi's inferred reasoning:none/default thinking fields.
    delete body.reasoning;
    delete body.reasoning_effort;
    delete body.thinking;
    delete body.output_config;
    if (permit.effort !== 'default') {
      if (provider.protocol === 'anthropic') {
        if (permit.effort === 'none') {
          body.thinking = { type: 'disabled' };
        } else {
          body.thinking = { type: 'adaptive' };
          body.output_config = { effort: permit.effort };
        }
      } else if (provider.protocol === 'responses') {
        body.reasoning = { effort: permit.effort };
      } else {
        body.reasoning_effort = permit.effort;
      }
    }
    if (permit.final) {
      body.tool_choice =
        provider.protocol === 'anthropic' ? { type: 'none' } : 'none';
    }
    return body;
  };
}
