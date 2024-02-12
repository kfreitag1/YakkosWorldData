import numpy as np
import pandas as pd
from pydub import AudioSegment
from pydub.playback import play
from pyrubberband import pyrb


def generate_audio_file(segments: pd.DataFrame):
    full_song = AudioSegment.from_file("../media/video.mp4", "mp4")
    frame_rate = full_song.frame_rate

    # Construct time-mapping list, tuples containing: (from frame, to frame)
    time_map = []
    for index, row in segments.iterrows():
        # Start time point
        time_map.append((
            int(row["Start.Time"] * frame_rate),
            int(row["Start.Frame"] / 60 * frame_rate)))
        # End (or mid) time point
        time_map.append((
            int(row["End.Time"] * frame_rate),
            int(row["End.Frame"] / 60 * frame_rate)))

    # Add in special first and last segments at a normal playback rate
    time_map.insert(0, (0, 0))
    # Last segment
    total_frames = int(len(full_song.get_array_of_samples())/2)
    frames_last_segment = total_frames - time_map[-1][0]
    time_map.append((
        total_frames,
        time_map[-1][1] + frames_last_segment
    ))

    # Generate and output time mapped song using rubberband
    time_shifted_song = time_map_stretch(full_song, time_map)
    time_shifted_song.export("../audio.wav")


def time_map_stretch(audio: AudioSegment, time_map):
    # Reshaped np array of audio data
    audio_data = np.array(audio.get_array_of_samples())
    if audio.channels == 2:
        audio_data = audio_data.reshape((-1, 2))

    # Output of rubberband time shifting
    output = pyrb.timemap_stretch(audio_data, audio.frame_rate, time_map)

    # Convert back to pydub AudioSegment
    new_data = np.int16(output * 2 ** 15)
    return AudioSegment(new_data.tobytes(), frame_rate=audio.frame_rate,
                        sample_width=2, channels=audio.channels)
