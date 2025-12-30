/**
 * OpenAI API Format Converter
 * Converts between OpenAI Chat Completions API format and Anthropic Messages API format
 */

import crypto from "crypto";

/**
 * Convert OpenAI Chat Completions request to Anthropic Messages format
 *
 * @param {Object} openaiRequest - OpenAI format request
 * @returns {Object} Anthropic format request
 */
export function convertOpenAIToAnthropic(openaiRequest) {
  const { model, messages, max_tokens, temperature, top_p, stream, stop } =
    openaiRequest;

  // Extract system message and convert other messages
  let systemPrompt = null;
  const anthropicMessages = [];

  for (const msg of messages) {
    if (msg.role === "system") {
      // Collect system messages
      if (systemPrompt) {
        systemPrompt += "\n\n" + msg.content;
      } else {
        systemPrompt = msg.content;
      }
    } else {
      // Convert user/assistant messages
      anthropicMessages.push({
        role: msg.role,
        content: msg.content,
      });
    }
  }

  const anthropicRequest = {
    model: model,
    messages: anthropicMessages,
    max_tokens: max_tokens || 4096,
    stream: stream || false,
  };

  if (systemPrompt) {
    anthropicRequest.system = systemPrompt;
  }

  if (temperature !== undefined) {
    anthropicRequest.temperature = temperature;
  }

  if (top_p !== undefined) {
    anthropicRequest.top_p = top_p;
  }

  if (stop) {
    anthropicRequest.stop_sequences = Array.isArray(stop) ? stop : [stop];
  }

  return anthropicRequest;
}

/**
 * Convert Anthropic Messages response to OpenAI Chat Completions format
 *
 * @param {Object} anthropicResponse - Anthropic format response
 * @param {string} model - Model name used
 * @returns {Object} OpenAI format response
 */
export function convertAnthropicToOpenAI(anthropicResponse, model) {
  const { id, content, stop_reason, usage } = anthropicResponse;

  // Extract text content from Anthropic response
  let textContent = "";
  if (Array.isArray(content)) {
    for (const block of content) {
      if (block.type === "text") {
        textContent += block.text;
      }
    }
  } else if (typeof content === "string") {
    textContent = content;
  }

  // Map stop reason
  let finishReason = "stop";
  if (stop_reason === "max_tokens") {
    finishReason = "length";
  } else if (stop_reason === "tool_use") {
    finishReason = "tool_calls";
  }

  return {
    id: id || `chatcmpl-${crypto.randomBytes(12).toString("hex")}`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: model,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: textContent,
        },
        finish_reason: finishReason,
      },
    ],
    usage: {
      prompt_tokens: usage?.input_tokens || 0,
      completion_tokens: usage?.output_tokens || 0,
      total_tokens: (usage?.input_tokens || 0) + (usage?.output_tokens || 0),
    },
  };
}

/**
 * Convert Anthropic SSE event to OpenAI SSE format
 *
 * @param {Object} anthropicEvent - Anthropic SSE event
 * @param {string} model - Model name
 * @param {string} messageId - Message ID for the response
 * @returns {Object|null} OpenAI SSE event or null if not applicable
 */
export function convertAnthropicSSEToOpenAI(anthropicEvent, model, messageId) {
  const { type } = anthropicEvent;

  if (type === "message_start") {
    // Return initial chunk
    return {
      id: messageId,
      object: "chat.completion.chunk",
      created: Math.floor(Date.now() / 1000),
      model: model,
      choices: [
        {
          index: 0,
          delta: { role: "assistant", content: "" },
          finish_reason: null,
        },
      ],
    };
  }

  if (type === "content_block_delta") {
    const delta = anthropicEvent.delta;
    if (delta?.type === "text_delta") {
      return {
        id: messageId,
        object: "chat.completion.chunk",
        created: Math.floor(Date.now() / 1000),
        model: model,
        choices: [
          {
            index: 0,
            delta: { content: delta.text },
            finish_reason: null,
          },
        ],
      };
    }
  }

  if (type === "message_delta") {
    const stopReason = anthropicEvent.delta?.stop_reason;
    let finishReason = "stop";
    if (stopReason === "max_tokens") {
      finishReason = "length";
    } else if (stopReason === "tool_use") {
      finishReason = "tool_calls";
    }

    return {
      id: messageId,
      object: "chat.completion.chunk",
      created: Math.floor(Date.now() / 1000),
      model: model,
      choices: [
        {
          index: 0,
          delta: {},
          finish_reason: finishReason,
        },
      ],
    };
  }

  if (type === "message_stop") {
    // Signal end of stream
    return "[DONE]";
  }

  return null;
}

export default {
  convertOpenAIToAnthropic,
  convertAnthropicToOpenAI,
  convertAnthropicSSEToOpenAI,
};
