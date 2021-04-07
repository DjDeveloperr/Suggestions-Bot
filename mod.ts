import * as slash from "https://raw.githubusercontent.com/DjDeveloperr/harmony/refactor/deploy.ts";

slash.init({ env: true });
const WEBHOOK_URL = Deno.env.get("WEBHOOK")!;

const commands: slash.SlashCommandPartial[] = [
  {
    name: "suggest",
    description: "Create a new suggestion.",
    options: [
      {
        name: "suggestion",
        type: slash.SlashCommandOptionType.STRING,
        description: "Suggestion to make.",
        required: true,
      },
      {
        name: "reason",
        type: slash.SlashCommandOptionType.STRING,
        description: "What is the reason behind the suggestion?",
        required: true,
      },
    ],
  },
];

slash.commands.all().then((list) => {
  if (list.size !== commands.length) {
    slash.commands.bulkEdit(commands);
  }
});

slash.handle("suggest", async (d) => {
  if (d.guild === undefined || d.user.id !== "422957901716652033") return;
  const suggestion = d.option<string>("suggestion");
  const reason = d.option<string>("reason");
  if (!suggestion || !reason)
    return d.reply({ content: "Invalid interaction.", ephemeral: true });

  let quit = false;
  let err = (msg: string) => {
    quit = true;
    return d.reply(msg, { ephemeral: true });
  };

  await Promise.all(
    [
      { name: "Suggestion", value: suggestion },
      { name: "Reason", value: reason },
    ].map((entry) => {
      if (quit) return;
      if (entry.value.length < 10)
        return err(
          `${entry.name} is too short. It must be at least 10 characters.`
        );

      if (entry.value.length > 1000)
        return err(
          `${entry.name} is too long. It can be max 1,000 characters.`
        );
    })
  );

  await d.defer(true);

  await slash.client.rest
    .post(WEBHOOK_URL + "?wait=true", {
      username: d.user.username,
      avatar: d.user.avatarURL("png"),
      embeds: [
        {
          title: "Suggestion",
          color: 0x32c453,
          fields: [
            {
              name: "Suggestion",
              value: suggestion,
            },
            {
              name: "Reason",
              value: reason,
            },
          ],
        },
      ],
    })
    .then(async (msg) => {
      await slash.client.rest.endpoints.createReaction(
        msg.channel_id,
        msg.id,
        "👍"
      );
      await slash.client.rest.endpoints.createReaction(
        msg.channel_id,
        msg.id,
        "👎"
      );
      await d.editResponse({ content: "Created suggession!" });
    });
});

slash.handle("*", (d) => d.reply("Unhandled command.", { ephemeral: true }));
slash.client.on("interactionError", console.error);
