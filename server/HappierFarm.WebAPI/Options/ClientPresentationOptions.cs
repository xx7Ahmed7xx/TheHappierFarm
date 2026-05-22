namespace HappierFarm.WebAPI.Options;

/// <summary>Non-gameplay UI flags sent to the client on each farm snapshot.</summary>
public sealed class ClientPresentationOptions
{
    public const string SectionName = "ClientPresentation";

    /// <summary>When true, the client shows a small non-blocking beta badge (see labels).</summary>
    public bool ShowBetaBadge { get; set; }

    public string BetaBadgeLabelEn { get; set; } = "Beta";

    public string BetaBadgeLabelAr { get; set; } = "نسخة تجريبية";
}
